import { ClientSession } from 'mongoose';
import ProductRental from '../models/ProductRental';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import { nextSequence, formatId } from '../models/Counter';
import { IProductRental } from '../interfaces/IProductRental';
import { badRequest, conflict, forbidden, notFound } from '../utils/AppError';
import { withTransaction } from '../utils/transaction';
import { paginate, searchFilter, Paginated } from '../utils/paginate';
import { quoteProductRental, calculateLateFee, round2, startOfDay } from '../utils/pricing';

const POPULATE = [{ path: 'customer' }, { path: 'items.itemId' }];

interface CreateRentalInput {
    customerId: string;
    items: Array<{ itemId: string; quantity: number }>;
    dueDate: Date;
    rentalDate?: Date;
    paymentStatus?: 'Paid' | 'Pending' | 'Partial';
    notes?: string;
}

interface ProcessReturnInput {
    rentalId: string;
    returnDate: Date;
    /** Per-item damage. Items omitted here are returned undamaged. */
    damages?: Array<{ itemId: string; charge: number; note?: string }>;
    /** Overrides the computed late fee — an explicit goodwill decision, always audited. */
    lateFeeOverride?: number;
    paymentStatus: 'Paid' | 'Pending' | 'Partial';
    notes?: string;
}

class RentalService {
    async getAllRentals(opts: { page: number; limit: number; search?: string; status?: string }): Promise<Paginated<IProductRental>> {
        const filter: Record<string, unknown> = { isDeleted: false, isArchived: false };
        if (opts.status && opts.status !== 'All') filter.status = opts.status;
        if (opts.search) Object.assign(filter, searchFilter(opts.search, ['rentalId']));

        return paginate(ProductRental, {
            filter,
            page: opts.page,
            limit: opts.limit,
            sort: { createdAt: -1 },
            populate: POPULATE,
        });
    }

    async getArchivedRentals(opts: { page: number; limit: number }) {
        return paginate(ProductRental, {
            filter: { isArchived: true },
            page: opts.page,
            limit: opts.limit,
            sort: { archivedAt: -1 },
            populate: POPULATE,
        });
    }

    async getRentalById(id: string): Promise<IProductRental> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false }).populate(POPULATE);
        if (!rental) throw notFound('Rental not found');
        return rental;
    }

    /**
     * Creates a rental, claims its inventory and appends to customer history
     * as one atomic unit.
     *
     * Availability is claimed with a conditional updateMany rather than a
     * read-then-write: two clerks checking out the same guitar at the same
     * moment both used to pass the old `find`-based check.
     */
    async createNewRental(input: CreateRentalInput): Promise<IProductRental | null> {
        const rentalDate = input.rentalDate ?? new Date();
        if (startOfDay(input.dueDate) < startOfDay(rentalDate)) {
            throw badRequest('Due date cannot be before the rental date');
        }

        const uniqueIds = new Set(input.items.map(i => String(i.itemId)));
        if (uniqueIds.size !== input.items.length) {
            throw badRequest('The same item appears more than once in this rental');
        }

        const rentalId = await withTransaction(async session => {
            const customer = await Customer.findById(input.customerId).session(session);
            if (!customer) throw notFound('Customer not found');
            if (customer.isBlacklisted) throw forbidden('Customer is blacklisted and cannot rent items');

            const itemIds = [...uniqueIds];
            const inventory = await Inventory.find({ _id: { $in: itemIds } }).session(session);
            if (inventory.length !== itemIds.length) throw notFound('One or more inventory items do not exist');

            // Atomic claim: only rows still Available are flipped. If fewer rows
            // changed than we asked for, another request won the race.
            const claim = await Inventory.updateMany(
                { _id: { $in: itemIds }, status: 'Available', isArchived: false },
                { $set: { status: 'Rented' } },
                { session }
            );
            if (claim.modifiedCount !== itemIds.length) {
                const unavailable = inventory.filter(i => i.status !== 'Available' || i.isArchived);
                const names = unavailable.map(i => i.itemName).join(', ');
                throw conflict(
                    names
                        ? `No longer available: ${names}`
                        : 'One or more items were taken by another checkout — please retry'
                );
            }

            // Price from stored rates. The client never supplies an amount.
            const quote = quoteProductRental(inventory, input.items, rentalDate, input.dueDate);

            const seq = await nextSequence('productRental', session);
            const [rental] = await ProductRental.create(
                [
                    {
                        rentalId: formatId('PR', seq),
                        customer: input.customerId,
                        items: quote.lines.map(l => ({
                            itemId: l.itemId,
                            quantity: l.quantity,
                            dailyRate: l.dailyRate,
                            isDamaged: false,
                            damageCharge: 0,
                        })),
                        rentalDate,
                        dueDate: input.dueDate,
                        baseAmount: quote.baseAmount,
                        totalAmount: quote.baseAmount,
                        paymentStatus: input.paymentStatus ?? 'Pending',
                        notes: input.notes,
                    },
                ],
                { session }
            );

            await Customer.findByIdAndUpdate(
                input.customerId,
                { $push: { rentalHistory: rental._id } },
                { session }
            );

            return rental._id;
        });

        return ProductRental.findById(rentalId).populate(POPULATE);
    }

    /** Returns a quote without persisting anything, so the UI can show a live total. */
    async quoteRental(items: Array<{ itemId: string; quantity: number }>, rentalDate: Date, dueDate: Date) {
        const inventory = await Inventory.find({ _id: { $in: items.map(i => i.itemId) } });
        if (inventory.length !== new Set(items.map(i => String(i.itemId))).size) {
            throw notFound('One or more inventory items do not exist');
        }
        return quoteProductRental(inventory, items, rentalDate, dueDate);
    }

    async updateRentalStatus(id: string, status: string): Promise<IProductRental> {
        if (status === 'Returned') {
            throw badRequest('Use the return flow to complete a rental so charges are calculated');
        }
        const rental = await ProductRental.findOneAndUpdate(
            { _id: id, isDeleted: false, status: { $ne: 'Returned' } },
            { status },
            { returnDocument: 'after', runValidators: true }
        ).populate(POPULATE);
        if (!rental) throw notFound('Rental not found, or it has already been returned');
        return rental;
    }

    async extendDueDate(id: string, newDueDate: Date): Promise<IProductRental> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Rental not found');
        if (rental.status === 'Returned') throw badRequest('Cannot extend a returned rental');
        if (startOfDay(newDueDate) <= startOfDay(rental.dueDate)) {
            throw badRequest('The new due date must be later than the current one');
        }

        // Extending is re-renting: re-price for the longer period rather than
        // handing the customer the extra days at no charge.
        const quote = quoteProductRental(
            rental.items.map(i => ({ _id: i.itemId, itemName: '', baseRentalPrice: i.dailyRate })),
            rental.items.map(i => ({ itemId: String(i.itemId), quantity: i.quantity })),
            rental.rentalDate,
            newDueDate
        );

        rental.dueDate = newDueDate;
        rental.baseAmount = quote.baseAmount;
        rental.totalAmount = round2(quote.baseAmount + rental.lateFee + rental.damageCharges);
        if (rental.status === 'Overdue') rental.status = 'Rented';
        // A new due date is a new reminder cycle.
        rental.remindersSent = [];
        await rental.save();

        return rental;
    }

    async updatePaymentStatus(id: string, paymentStatus: string): Promise<IProductRental> {
        const rental = await ProductRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { paymentStatus },
            { returnDocument: 'after', runValidators: true }
        );
        if (!rental) throw notFound('Rental not found');
        return rental;
    }

    async archiveRental(id: string) {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Rental not found');
        if (rental.status !== 'Returned') {
            throw badRequest('Only returned rentals can be archived');
        }
        rental.isArchived = true;
        rental.archivedAt = new Date();
        await rental.save({ validateModifiedOnly: true });
        return { message: 'Rental archived' };
    }

    async restoreRental(id: string) {
        const rental = await ProductRental.findOne({ _id: id, isArchived: true });
        if (!rental) throw notFound('Archived rental not found');
        rental.isArchived = false;
        rental.archivedAt = undefined;
        await rental.save({ validateModifiedOnly: true });
        return { message: 'Rental restored' };
    }

    async deleteRental(id: string) {
        return withTransaction(async session => {
            const rental = await ProductRental.findOne({ _id: id, isDeleted: false }).session(session);
            if (!rental) throw notFound('Rental not found');

            // Release inventory before removing the record — otherwise the items
            // stay 'Rented' forever with nothing left pointing at them.
            if (rental.status !== 'Returned') {
                await Inventory.updateMany(
                    { _id: { $in: rental.items.map(i => i.itemId) }, status: 'Rented' },
                    { $set: { status: 'Available' } },
                    { session }
                );
            }
            await Customer.findByIdAndUpdate(
                rental.customer,
                { $pull: { rentalHistory: rental._id } },
                { session }
            );
            await ProductRental.deleteOne({ _id: id }, { session });
            return { message: 'Rental permanently deleted' };
        });
    }

    async getRentalByQR(qrCodeId: string) {
        const inventory = await Inventory.findOne({ qrCodeId, isArchived: false });
        if (!inventory) throw notFound('No inventory item found with this QR code');

        const rental = await ProductRental.findOne({
            'items.itemId': inventory._id,
            status: { $in: ['Rented', 'Overdue'] },
            isDeleted: false,
            isArchived: false,
        })
            .populate(POPULATE)
            .sort({ createdAt: -1 });

        if (!rental) throw notFound('No active rental found for this instrument');
        return rental;
    }

    /**
     * Completes a rental: releases undamaged items, quarantines damaged ones,
     * and computes the final amount from the preserved `baseAmount`.
     */
    async processReturn(input: ProcessReturnInput) {
        const rentalId = await withTransaction(async session => {
            const rental = await ProductRental.findOne({ _id: input.rentalId, isDeleted: false }).session(session);
            if (!rental) throw notFound('Rental not found');
            if (rental.status === 'Returned') throw badRequest('This rental has already been returned');
            if (input.returnDate < startOfDay(rental.rentalDate)) {
                throw badRequest('Return date cannot be before the rental date');
            }

            const damageById = new Map((input.damages ?? []).map(d => [String(d.itemId), d]));
            const unknown = [...damageById.keys()].filter(
                id => !rental.items.some(i => String(i.itemId) === id)
            );
            if (unknown.length) throw badRequest('Damage was reported for an item that is not on this rental');

            let damageTotal = 0;
            rental.items.forEach(item => {
                const damage = damageById.get(String(item.itemId));
                if (damage && damage.charge > 0) {
                    item.isDamaged = true;
                    item.damageCharge = round2(damage.charge);
                    item.damageNote = damage.note;
                    damageTotal += item.damageCharge;
                } else {
                    item.isDamaged = false;
                    item.damageCharge = 0;
                }
            });

            const dailyRateTotal = rental.items.reduce((sum, i) => sum + i.dailyRate * i.quantity, 0);
            const lateFee =
                input.lateFeeOverride !== undefined
                    ? round2(input.lateFeeOverride)
                    : calculateLateFee(dailyRateTotal, rental.dueDate, input.returnDate);

            rental.status = 'Returned';
            rental.returnDate = input.returnDate;
            rental.lateFee = lateFee;
            rental.damageCharges = round2(damageTotal);
            rental.damageNotes = (input.damages ?? [])
                .filter(d => d.note)
                .map(d => d.note)
                .join('; ');
            // baseAmount is never overwritten, so the original checkout price
            // survives the return and the final total stays reconstructible.
            rental.totalAmount = round2(rental.baseAmount + lateFee + damageTotal);
            rental.paymentStatus = input.paymentStatus;
            if (input.notes) rental.notes = input.notes;
            await rental.save({ session });

            // Only genuinely damaged items are quarantined — the previous code
            // marked every item on the rental Damaged if any charge was entered.
            const damagedIds = rental.items.filter(i => i.isDamaged).map(i => i.itemId);
            const cleanIds = rental.items.filter(i => !i.isDamaged).map(i => i.itemId);

            if (cleanIds.length) {
                await Inventory.updateMany(
                    { _id: { $in: cleanIds } },
                    { $set: { status: 'Available' } },
                    { session }
                );
            }
            if (damagedIds.length) {
                await Inventory.updateMany(
                    { _id: { $in: damagedIds } },
                    { $set: { status: 'Damaged' } },
                    { session }
                );
            }

            return rental._id;
        });

        return ProductRental.findById(rentalId).populate(POPULATE);
    }

    /** Flips due rentals to Overdue. Called by the scheduled job. */
    async markOverdueRentals(session?: ClientSession) {
        const result = await ProductRental.updateMany(
            { status: 'Rented', dueDate: { $lt: startOfDay(new Date()) }, isDeleted: false },
            { $set: { status: 'Overdue' } },
            { session }
        );
        return result.modifiedCount;
    }
}

export default new RentalService();
