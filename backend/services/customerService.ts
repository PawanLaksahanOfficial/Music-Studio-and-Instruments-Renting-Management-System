import Customer from '../models/Customer';
import { ICustomer } from '../interfaces/ICustomer';

class CustomerService {
    async getAllCustomers(): Promise<ICustomer[]> {
        return await Customer.find().sort({ createdAt: -1 });
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

    async deleteCustomer(id: string): Promise<{ message: string }> {
        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        return { message: 'Customer deleted' };
    }
}

export default new CustomerService();
