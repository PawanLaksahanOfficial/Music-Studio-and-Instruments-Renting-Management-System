import { z } from 'zod';
import Customer from '../models/Customer';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import Invoice from '../models/Invoice';
import { ACTIVE_RENTAL_STATUSES } from '../config/constants';
import { conflict, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { createCustomerBody, updateCustomerBody } from '../validators/customer';
import { AuthUser } from '../interfaces/IUser';

type CreateCustomerInput = z.infer<typeof createCustomerBody>;
type UpdateCustomerInput = z.infer<typeof updateCustomerBody>;

const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

class CustomerService {
    list() {
        return Customer.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    }

    listArchived() {
        return Customer.find({ isArchived: true }).sort({ archivedAt: -1 }).lean();
    }

    async getById(id: string) {
        const customer = await Customer.findById(id).lean();
        if (!customer) throw notFound('Customer');
        return customer;
    }

    async create(input: CreateCustomerInput, actor: AuthUser) {
        await this.assertNicAvailable(input.nicOrPassport);
        const customer = await Customer.create({ ...input, email: input.email || undefined });
        logger.info({ event: 'customer.created', customerId: customer.id, by: actor.id }, 'Customer created');
        return customer.toObject();
    }

    async update(id: string, input: UpdateCustomerInput, actor: AuthUser) {
        if (input.nicOrPassport) await this.assertNicAvailable(input.nicOrPassport, id);

        const { email, ...rest } = input;
        const update = email === '' ? { $set: rest, $unset: { email: 1 } } : { $set: { ...rest, ...(email ? { email } : {}) } };

        const customer = await Customer.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean();
        if (!customer) throw notFound('Customer');
        logger.info({ event: 'customer.updated', customerId: id, by: actor.id }, 'Customer updated');
        return customer;
    }

    async toggleBlacklist(id: string, actor: AuthUser) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer');
        customer.isBlacklisted = !customer.isBlacklisted;
        await customer.save();
        logger.info({ event: customer.isBlacklisted ? 'customer.blacklisted' : 'customer.unblacklisted', customerId: id, by: actor.id }, 'Customer blacklist changed');
        return { isBlacklisted: customer.isBlacklisted };
    }

    async archive(id: string, actor: AuthUser) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer');
        await this.assertNoActiveBusiness(id, 'archive');

        customer.isArchived = true;
        customer.archivedAt = new Date();
        await customer.save();
        logger.info({ event: 'customer.archived', customerId: id, by: actor.id }, 'Customer archived');
        return { message: 'Customer archived' };
    }

    async restore(id: string, actor: AuthUser) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer');
        customer.isArchived = false;
        customer.archivedAt = undefined;
        await customer.save();
        logger.info({ event: 'customer.restored', customerId: id, by: actor.id }, 'Customer restored');
        return { message: 'Customer restored' };
    }

    /** Permanent delete is only allowed for customers without any history (rentals, bookings, invoices). */
    async remove(id: string, actor: AuthUser) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer');

        const [rentals, bookings, invoices] = await Promise.all([
            ProductRental.exists({ customer: id, isDeleted: false }),
            StudioRental.exists({ customer: id, isDeleted: false }),
            Invoice.exists({ customer: id }),
        ]);
        if (rentals || bookings || invoices) {
            throw conflict('This customer has rental or invoice history and cannot be deleted. Archive the customer instead.');
        }

        await customer.deleteOne();
        logger.info({ event: 'customer.deleted', customerId: id, by: actor.id }, 'Customer deleted');
        return { message: 'Customer deleted permanently' };
    }

    async getProfile(id: string) {
        const customer = await Customer.findById(id).lean();
        if (!customer) throw notFound('Customer');

        const rentals = await ProductRental.find({ customer: id, isDeleted: false })
            .populate('items.itemId', 'itemName serialNumber')
            .sort({ createdAt: -1 })
            .lean();

        let totalSpending = 0;
        let outstandingFines = 0;
        for (const r of rentals) {
            totalSpending += r.totalAmount || 0;
            if (r.paymentStatus !== 'Paid') outstandingFines += (r.lateFee || 0) + (r.damageCharges || 0);
        }

        return {
            customer,
            stats: {
                totalRentals: rentals.length,
                activeRentals: rentals.filter(r => (ACTIVE_RENTAL_STATUSES as readonly string[]).includes(r.status)).length,
                totalSpending,
                lastRentalDate: rentals[0]?.createdAt ?? null,
                outstandingFines,
            },
            rentalHistory: rentals.map(r => ({
                _id: r._id,
                rentalId: r.rentalId,
                items: r.items,
                rentalDate: r.rentalDate,
                dueDate: r.dueDate,
                returnDate: r.returnDate,
                status: r.status,
                totalAmount: r.totalAmount,
                paymentStatus: r.paymentStatus,
                lateFee: r.lateFee || 0,
                damageCharges: r.damageCharges || 0,
                damageNotes: r.damageNotes || '',
                isArchived: r.isArchived,
            })),
        };
    }

    private async assertNicAvailable(nicOrPassport: string, excludeId?: string) {
        const existing = await Customer.findOne({ nicOrPassport, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
            .collation(CASE_INSENSITIVE)
            .select('_id')
            .lean();
        if (existing) throw conflict('A customer with this NIC / passport number already exists');
    }

    private async assertNoActiveBusiness(customerId: string, action: string) {
        const [activeRental, upcomingBooking] = await Promise.all([
            ProductRental.exists({ customer: customerId, isDeleted: false, status: { $in: ACTIVE_RENTAL_STATUSES } }),
            StudioRental.exists({ customer: customerId, isDeleted: false, status: 'Confirmed', endTime: { $gte: new Date() } }),
        ]);
        if (activeRental) throw conflict(`This customer still has items out on rental. Process the return before you ${action} them.`);
        if (upcomingBooking) throw conflict(`This customer has an upcoming studio booking. Cancel it before you ${action} them.`);
    }
}

export default new CustomerService();
