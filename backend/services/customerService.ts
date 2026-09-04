import Customer from '../models/Customer';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import { ICustomer } from '../interfaces/ICustomer';
import { badRequest, conflict, notFound } from '../utils/AppError';
import { paginate, searchFilter, Paginated } from '../utils/paginate';
import { round2 } from '../utils/pricing';

const SEARCH_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'nicOrPassport'];

interface CustomerInput {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nicOrPassport: string;
}

class CustomerService {
    async getAllCustomers(opts: { page: number; limit: number; search?: string }): Promise<Paginated<ICustomer>> {
        const filter: Record<string, unknown> = { isArchived: false };
        if (opts.search) Object.assign(filter, searchFilter(opts.search, SEARCH_FIELDS));
        return paginate(Customer, { filter, page: opts.page, limit: opts.limit, sort: { createdAt: -1 } });
    }

    async getArchivedCustomers(opts: { page: number; limit: number; search?: string }) {
        const filter: Record<string, unknown> = { isArchived: true };
        if (opts.search) Object.assign(filter, searchFilter(opts.search, SEARCH_FIELDS));
        return paginate(Customer, { filter, page: opts.page, limit: opts.limit, sort: { archivedAt: -1 } });
    }

    async getCustomerById(id: string): Promise<ICustomer> {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer not found');
        return customer;
    }

    async createCustomer(data: CustomerInput): Promise<ICustomer> {
        const existing = await Customer.findOne({ nicOrPassport: data.nicOrPassport });
        if (existing) throw conflict('A customer with this NIC/Passport already exists');
        return Customer.create(data);
    }

    async updateCustomer(id: string, updates: Partial<CustomerInput>): Promise<ICustomer> {
        const customer = await Customer.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
        if (!customer) throw notFound('Customer not found');
        return customer;
    }

    async toggleBlacklist(id: string) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer not found');
        customer.isBlacklisted = !customer.isBlacklisted;
        await customer.save({ validateModifiedOnly: true });
        return { isBlacklisted: customer.isBlacklisted };
    }

    async archiveCustomer(id: string) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer not found');

        const openRentals = await ProductRental.countDocuments({
            customer: id,
            status: { $in: ['Rented', 'Overdue'] },
            isDeleted: false,
        });
        if (openRentals > 0) {
            throw badRequest(`This customer has ${openRentals} rental(s) still out — process the returns first`);
        }

        customer.isArchived = true;
        customer.archivedAt = new Date();
        await customer.save({ validateModifiedOnly: true });
        return { message: 'Customer archived' };
    }

    async restoreCustomer(id: string) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer not found');
        customer.isArchived = false;
        customer.archivedAt = undefined;
        await customer.save({ validateModifiedOnly: true });
        return { message: 'Customer restored' };
    }

    async deleteCustomer(id: string) {
        const rentalCount = await ProductRental.countDocuments({ customer: id });
        if (rentalCount > 0) {
            throw badRequest(
                `This customer has ${rentalCount} rental record${rentalCount === 1 ? '' : 's'} — archive them instead of deleting`
            );
        }
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) throw notFound('Customer not found');
        return { message: 'Customer deleted permanently' };
    }

    /**
     * Profile with lifetime stats. Totals are aggregated in the database
     * rather than by loading every rental and summing in JavaScript.
     */
    async getCustomerProfile(id: string) {
        const customer = await Customer.findById(id);
        if (!customer) throw notFound('Customer not found');

        const [statsAgg, studioAgg, rentalHistory] = await Promise.all([
            ProductRental.aggregate([
                { $match: { customer: customer._id, isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        totalRentals: { $sum: 1 },
                        totalSpending: { $sum: '$totalAmount' },
                        lastRentalDate: { $max: '$createdAt' },
                        outstandingFines: {
                            $sum: {
                                $cond: [
                                    { $ne: ['$paymentStatus', 'Paid'] },
                                    { $add: [{ $ifNull: ['$lateFee', 0] }, { $ifNull: ['$damageCharges', 0] }] },
                                    0,
                                ],
                            },
                        },
                        lateReturns: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$returnDate', null] },
                                            { $gt: ['$returnDate', '$dueDate'] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        openRentals: {
                            $sum: { $cond: [{ $in: ['$status', ['Rented', 'Overdue']] }, 1, 0] },
                        },
                    },
                },
            ]),
            StudioRental.aggregate([
                { $match: { customer: customer._id, isDeleted: false } },
                { $group: { _id: null, totalBookings: { $sum: 1 }, totalSpending: { $sum: '$totalAmount' } } },
            ]),
            ProductRental.find({ customer: id, isDeleted: false })
                .populate('items.itemId', 'itemName serialNumber brand')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
        ]);

        const s = statsAgg[0] ?? {
            totalRentals: 0,
            totalSpending: 0,
            lastRentalDate: null,
            outstandingFines: 0,
            lateReturns: 0,
            openRentals: 0,
        };
        const studio = studioAgg[0] ?? { totalBookings: 0, totalSpending: 0 };

        return {
            customer: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                nicOrPassport: customer.nicOrPassport,
                isBlacklisted: customer.isBlacklisted,
                createdAt: customer.createdAt,
            },
            stats: {
                totalRentals: s.totalRentals,
                totalSpending: round2(s.totalSpending + studio.totalSpending),
                lastRentalDate: s.lastRentalDate,
                outstandingFines: round2(s.outstandingFines),
                lateReturns: s.lateReturns,
                openRentals: s.openRentals,
                studioBookings: studio.totalBookings,
                onTimeRate:
                    s.totalRentals > 0 ? round2(((s.totalRentals - s.lateReturns) / s.totalRentals) * 100) : null,
            },
            rentalHistory,
        };
    }
}

export default new CustomerService();
