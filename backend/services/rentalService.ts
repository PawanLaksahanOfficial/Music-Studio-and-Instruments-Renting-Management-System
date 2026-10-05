import { Types } from 'mongoose';
import { z } from 'zod';
import ProductRental from '../models/ProductRental';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import { ACTIVE_RENTAL_STATUSES } from '../config/constants';
import { AuthUser } from '../interfaces/IUser';
import { AppError, badRequest, conflict, forbidden, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { roundMoney, sumMoney } from '../utils/money';
import { lateDays, parseDateOnly, rentalDays, today } from '../utils/dates';
import { nextDocumentNumber } from '../utils/sequence';
import { withTransaction } from '../utils/transaction';
import { createRentalBody, returnRentalBody, updateRentalBody } from '../validators/rental';
import invoiceService from './invoiceService';
import { parseQrCode } from './inventoryService';

type CreateRentalInput = z.infer<typeof createRentalBody>;
type UpdateRentalInput = z.infer<typeof updateRentalBody>;
type ReturnRentalInput = z.infer<typeof returnRentalBody>;

const CUSTOMER_FIELDS = 'firstName lastName phone email nicOrPassport isBlacklisted';
const ITEM_FIELDS = 'itemName serialNumber brand itemModel baseRentalPrice qrCodeId category status';

const findPopulated = (filter: Record<string, unknown>) =>
    ProductRental.findOne(filter)
        .populate('customer', CUSTOMER_FIELDS)
        .populate('items.itemId', ITEM_FIELDS)
        .lean();

const listPopulated = (filter: Record<string, unknown>, sort: Record<string, 1 | -1>) =>
    ProductRental.find(filter)
        .populate('customer', CUSTOMER_FIELDS)
        .populate('items.itemId', ITEM_FIELDS)
        .sort(sort)
        .lean();

interface RateSource {
    dailyRate?: number;
    itemId: Types.ObjectId | { baseRentalPrice?: number } | null;
}

/** Sum of the per-day rates of a rental's items (snapshot rate, else current list price). */
const dailyTotal = (items: RateSource[]) =>
    sumMoney(items.map(i => i.dailyRate ?? ((i.itemId as { baseRentalPrice?: number } | null)?.baseRentalPrice ?? 0)));

class RentalService {
    list() {
        return listPopulated({ isDeleted: false, isArchived: false }, { createdAt: -1 });
    }

    listArchived() {
        return listPopulated({ isDeleted: false, isArchived: true }, { archivedAt: -1 });
    }

    async getById(id: string | Types.ObjectId) {
        const rental = await findPopulated({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Rental');
        return rental;
    }

    /**
     * Creates a rental. Item availability is reserved atomically and the price is computed here
     * (billable days x daily rates); nothing price-related is taken from the client. With
     * `input.invoice`, the matching invoice is created in the same transaction.
     */
    async create(input: CreateRentalInput, actor: AuthUser) {
        const start = input.rentalDate ? parseDateOnly(input.rentalDate) : today();
        const due = parseDateOnly(input.dueDate);
        if (start < today()) throw badRequest('Rental date cannot be in the past');
        if (due < start) throw badRequest('Due date must be on or after the rental date');

        const { rentalId, invoiceId } = await withTransaction(async () => {
            const customer = await Customer.findById(input.customerId).lean();
            if (!customer) throw notFound('Customer');
            if (customer.isArchived) throw conflict('This customer is archived. Restore them before creating a rental.');
            if (customer.isBlacklisted) throw forbidden('This customer is blacklisted and cannot rent items', 'CUSTOMER_BLACKLISTED');

            const items = await Inventory.find({ _id: { $in: input.itemIds } }).select('itemName baseRentalPrice').lean();
            if (items.length !== input.itemIds.length) throw notFound('One or more selected items');

            // Conditional updates make "check availability" and "mark rented" one atomic step per item;
            // a concurrent rental of the same item conflicts and is retried, then fails here.
            const unavailable: string[] = [];
            for (const item of items) {
                const result = await Inventory.updateOne(
                    { _id: item._id, status: 'Available', isArchived: false },
                    { $set: { status: 'Rented' } },
                );
                if (result.modifiedCount !== 1) unavailable.push(item.itemName);
            }
            if (unavailable.length) throw conflict(`Not available for rent: ${unavailable.join(', ')}`);

            const days = rentalDays(start, due);
            const baseAmount = roundMoney(days * sumMoney(items.map(i => i.baseRentalPrice)));

            const rental = await ProductRental.create({
                rentalId: await nextDocumentNumber('PR'),
                customer: customer._id,
                items: items.map(i => ({ itemId: i._id, quantity: 1, dailyRate: i.baseRentalPrice })),
                rentalDate: start,
                dueDate: due,
                baseAmount,
                totalAmount: baseAmount,
                paymentStatus: input.paymentStatus,
                paymentMethod: input.paymentMethod ?? input.invoice?.paymentMethod,
                notes: input.notes,
                createdBy: actor.id,
            });

            let createdInvoiceId: Types.ObjectId | undefined;
            if (input.invoice) {
                createdInvoiceId = await invoiceService.createInCurrentTransaction({
                    customerId: input.customerId,
                    productRentalIds: [rental.id],
                    studioRentalIds: [],
                    items: [],
                    tax: input.invoice.tax,
                    paymentMethod: input.invoice.paymentMethod,
                    paymentStatus: input.invoice.paymentStatus,
                    notes: input.invoice.notes ?? input.notes,
                }, actor);
            }

            logger.info({ event: 'rental.created', rentalId: rental.rentalId, items: items.length, baseAmount, by: actor.id }, 'Rental created');
            return { rentalId: rental._id, invoiceId: createdInvoiceId };
        });

        return {
            rental: await this.getById(rentalId),
            invoice: invoiceId ? await invoiceService.getById(invoiceId) : null,
        };
    }

    /** Updates the fields that don't affect inventory or pricing. */
    async update(id: string, input: UpdateRentalInput, actor: AuthUser) {
        const rental = await ProductRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: input },
            { returnDocument: 'after', runValidators: true },
        ).lean();
        if (!rental) throw notFound('Rental');
        logger.info({ event: 'rental.updated', rentalId: rental.rentalId, fields: Object.keys(input), by: actor.id }, 'Rental updated');
        return this.getById(id);
    }

    /**
     * Moves the due date and re-prices the rental for the new period, so extensions can't be used
     * to avoid paying for extra days. A fully paid rental that becomes more expensive turns Partial.
     */
    async extend(id: string, newDueDate: string, actor: AuthUser) {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false }).populate('items.itemId', 'baseRentalPrice');
        if (!rental) throw notFound('Rental');
        if (rental.status === 'Returned') throw conflict('This rental has already been returned');

        const due = parseDateOnly(newDueDate);
        if (due < today()) throw badRequest('The new due date cannot be in the past');
        if (due < rental.rentalDate) throw badRequest('The new due date must be after the rental date');

        const previousAmount = rental.totalAmount;
        const baseAmount = roundMoney(rentalDays(rental.rentalDate, due) * dailyTotal(rental.items));

        rental.dueDate = due;
        rental.baseAmount = baseAmount;
        rental.totalAmount = baseAmount;
        if (rental.status === 'Overdue') rental.status = 'Rented';
        if (rental.paymentStatus === 'Paid' && baseAmount > previousAmount) rental.paymentStatus = 'Partial';
        await rental.save();

        logger.info({ event: 'rental.extended', rentalId: rental.rentalId, newDueDate, previousAmount, baseAmount, by: actor.id }, 'Rental extended');
        return this.getById(id);
    }

    /** Fee preview for the return screen, using the same rules as `processReturn`. */
    async returnQuote(id: string, returnDate: string) {
        const rental = await findPopulated({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Rental');

        const late = lateDays(rental.dueDate, parseDateOnly(returnDate));
        const perDay = dailyTotal(rental.items as unknown as RateSource[]);
        const baseAmount = rental.baseAmount ?? rental.totalAmount;
        return { rentalId: rental.rentalId, baseAmount, dailyTotal: perDay, lateDays: late, lateFee: roundMoney(late * perDay) };
    }

    async processReturn(id: string, input: ReturnRentalInput, actor: AuthUser) {
        const returnDate = parseDateOnly(input.returnDate);
        if (returnDate > today()) throw badRequest('Return date cannot be in the future');
        if (input.lateFeeOverride !== undefined && actor.role !== 'Admin') {
            throw forbidden('Only administrators can adjust late fees');
        }

        await withTransaction(async () => {
            const rental = await ProductRental.findOne({ _id: id, isDeleted: false }).populate('items.itemId', 'baseRentalPrice');
            if (!rental) throw notFound('Rental');
            if (rental.status === 'Returned') throw conflict('This rental has already been returned');
            if (returnDate < rental.rentalDate) throw badRequest('Return date cannot be before the rental date');

            const itemIds = rental.items.map(i => ((i.itemId as unknown as { _id: Types.ObjectId })?._id ?? i.itemId).toString());
            const damaged = new Set(input.damagedItemIds);
            if ([...damaged].some(d => !itemIds.includes(d))) throw badRequest('Damaged items must be part of this rental');
            if (input.damageCharges > 0 && damaged.size === 0) {
                if (itemIds.length === 1) damaged.add(itemIds[0]);
                else throw badRequest('Select which items were damaged');
            }

            const computedLateFee = roundMoney(lateDays(rental.dueDate, returnDate) * dailyTotal(rental.items));
            const lateFee = input.lateFeeOverride ?? computedLateFee;
            if (lateFee !== computedLateFee) {
                logger.warn({ event: 'rental.late_fee_override', rentalId: rental.rentalId, computedLateFee, lateFee, by: actor.id }, 'Late fee manually adjusted');
            }

            const baseAmount = rental.baseAmount ?? rental.totalAmount;
            rental.status = 'Returned';
            rental.returnDate = returnDate;
            rental.lateFee = lateFee;
            rental.damageCharges = input.damageCharges;
            rental.damageNotes = input.damageNotes ?? '';
            rental.baseAmount = baseAmount;
            rental.totalAmount = roundMoney(baseAmount + lateFee + input.damageCharges);
            rental.paymentStatus = input.paymentStatus;
            if (input.paymentMethod) rental.paymentMethod = input.paymentMethod;
            rental.returnedBy = new Types.ObjectId(actor.id);
            await rental.save();

            const damagedIds = itemIds.filter(i => damaged.has(i));
            const intactIds = itemIds.filter(i => !damaged.has(i));
            if (intactIds.length) {
                await Inventory.updateMany({ _id: { $in: intactIds }, status: 'Rented' }, { $set: { status: 'Available' } });
            }
            if (damagedIds.length) {
                await Inventory.updateMany({ _id: { $in: damagedIds }, status: 'Rented' }, { $set: { status: 'Damaged' } });
            }

            logger.info({
                event: 'rental.returned', rentalId: rental.rentalId, lateFee, damageCharges: input.damageCharges,
                damagedItems: damagedIds.length, total: rental.totalAmount, by: actor.id,
            }, 'Rental returned');
        });

        return this.getById(id);
    }

    async archive(id: string, actor: AuthUser) {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Rental');
        if ((ACTIVE_RENTAL_STATUSES as readonly string[]).includes(rental.status)) {
            throw conflict('Items on this rental are still out. Process the return before archiving it.');
        }
        rental.isArchived = true;
        rental.archivedAt = new Date();
        await rental.save();
        logger.info({ event: 'rental.archived', rentalId: rental.rentalId, by: actor.id }, 'Rental archived');
        return { message: 'Rental archived' };
    }

    async restore(id: string, actor: AuthUser) {
        const rental = await ProductRental.findOne({ _id: id, isArchived: true, isDeleted: false });
        if (!rental) throw notFound('Archived rental');
        rental.isArchived = false;
        rental.archivedAt = undefined;
        await rental.save();
        logger.info({ event: 'rental.restored', rentalId: rental.rentalId, by: actor.id }, 'Rental restored');
        return { message: 'Rental restored' };
    }

    /** Permanently deletes a rental that isn't billed; items still out are returned to stock. */
    async remove(id: string, actor: AuthUser) {
        await withTransaction(async () => {
            const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
            if (!rental) throw notFound('Rental');

            const invoice = await Invoice.findOne({ productRentals: rental._id }).select('invoiceId').lean();
            if (invoice) throw conflict(`This rental is billed on invoice ${invoice.invoiceId} and cannot be deleted. Archive it instead.`);

            if (rental.status !== 'Returned') {
                await Inventory.updateMany(
                    { _id: { $in: rental.items.map(i => i.itemId) }, status: 'Rented' },
                    { $set: { status: 'Available' } },
                );
            }
            await rental.deleteOne();
            logger.info({ event: 'rental.deleted', rentalId: rental.rentalId, by: actor.id }, 'Rental deleted');
        });
        return { message: 'Rental permanently deleted' };
    }

    /** The active rental holding the item with this QR code (used by the QR return flow). */
    async getActiveByQrCode(raw: string) {
        const item = await Inventory.findOne({ qrCodeId: parseQrCode(raw), isArchived: false }).select('_id status').lean();
        if (!item) throw new AppError(404, 'No inventory item matches this QR code', 'QR_NOT_FOUND');

        const rental = await ProductRental.findOne({
            'items.itemId': item._id,
            status: { $in: ACTIVE_RENTAL_STATUSES },
            isDeleted: false,
        })
            .populate('customer', CUSTOMER_FIELDS)
            .populate('items.itemId', ITEM_FIELDS)
            .sort({ createdAt: -1 })
            .lean();
        if (!rental) throw new AppError(404, 'This item is not currently rented out', 'NOT_RENTED');
        return rental;
    }
}

export default new RentalService();
