import Customer from '../models/Customer';
import ProductRental from '../models/ProductRental';
import { ICustomer } from '../interfaces/ICustomer';

class CustomerService {
    async getAllCustomers(): Promise<ICustomer[]> {
        return await Customer.find({ isArchived: false }).sort({ createdAt: -1 });
    }

    async getCustomerById(id: string): Promise<ICustomer> {
        const customer = await Customer.findById(id).populate('rentalHistory');
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        return customer;
    }

    async createCustomer(data: any): Promise<ICustomer> {
        const { firstName, lastName, email, phone, address, nicOrPassport } = data;
        
        if (!firstName || !lastName || !phone || !nicOrPassport) {
            const error: any = new Error('firstName, lastName, phone and nicOrPassport are required');
            error.statusCode = 400;
            throw error;
        }

        const existing = await Customer.findOne({ nicOrPassport });
        if (existing) {
            const error: any = new Error('A customer with this NIC/Passport already exists');
            error.statusCode = 409;
            throw error;
        }
        return await Customer.create({ firstName, lastName, email, phone, address, nicOrPassport });
    }

    async updateCustomer(id: string, updateData: any): Promise<ICustomer> {
        const allowed = ['firstName', 'lastName', 'email', 'phone', 'address', 'nicOrPassport'];
        const updates: any = {};
        allowed.forEach(f => { if (updateData[f] !== undefined) updates[f] = updateData[f]; });

        const customer = await Customer.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        return customer;
    }

    async toggleBlacklist(id: string): Promise<{ isBlacklisted: boolean }> {
        const customer = await Customer.findById(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        customer.isBlacklisted = !customer.isBlacklisted;
        await customer.save();
        return { isBlacklisted: customer.isBlacklisted };
    }

    async archiveCustomer(id: string): Promise<{ message: string }> {
        const customer = await Customer.findById(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        customer.isArchived = true;
        customer.archivedAt = new Date();
        await customer.save();
        return { message: 'Customer archived' };
    }

    async restoreCustomer(id: string): Promise<{ message: string }> {
        const customer = await Customer.findById(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        customer.isArchived = false;
        customer.archivedAt = undefined;
        await customer.save();
        return { message: 'Customer restored' };
    }

    async deleteCustomer(id: string): Promise<{ message: string }> {
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        return { message: 'Customer deleted permanently' };
    }

    async getArchivedCustomers(): Promise<ICustomer[]> {
        return await Customer.find({ isArchived: true }).sort({ archivedAt: -1 });
    }

    async getCustomerProfile(id: string): Promise<any> {
        const customer = await Customer.findById(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        // Get all rentals for this customer
        const rentals = await ProductRental.find({
            customer: id,
            isDeleted: false,
            isArchived: false,
        }).populate('items.itemId').sort({ createdAt: -1 });
        const totalRentals = rentals.length;
        let totalSpending = 0;
        let lastRentalDate: string | null = null;
        let outstandingFines = 0;
        const rentalHistory: any[] = [];
        rentals.forEach((r, index) => {
            totalSpending += r.totalAmount || 0;
            if (index === 0) {
                lastRentalDate = r.createdAt?.toISOString() || null;
            }
            // outstanding fines = lateFee + damageCharges for unpaid/Pending/Partial
            if (r.paymentStatus !== 'Paid') {
                outstandingFines += (r.lateFee || 0) + (r.damageCharges || 0);
            }
            rentalHistory.push({
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
            });
        });

        return {
            customer: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                nicOrPassport: customer.nicOrPassport,
                isBlacklisted: customer.isBlacklisted,
                createdAt: customer.createdAt,
            },
            stats: {
                totalRentals,
                totalSpending,
                lastRentalDate,
                outstandingFines,
            },
            rentalHistory,
        };
    }
}

export default new CustomerService();
