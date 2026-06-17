import ProductRental from '../models/ProductRental';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import { IProductRental } from '../interfaces/IProductRental';

class RentalService {
    async getAllRentals(): Promise<IProductRental[]> {
        return await ProductRental.find({ isDeleted: false, isArchived: false })
            .populate('customer')
            .populate('items.itemId')
            .sort({ createdAt: -1 });
    }

    async getRentalById(id: string): Promise<IProductRental> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false })
            .populate('customer')
            .populate('items.itemId');       
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        return rental;
    }

    async createNewRental(rentalData: any): Promise<IProductRental | null> {
        const { customerId, items, dueDate, totalAmount, paymentStatus, notes } = rentalData;
        if (!customerId || !items?.length || !dueDate || totalAmount === undefined) {
            const error: any = new Error('customerId, items, dueDate and totalAmount are required');
            error.statusCode = 400;
            throw error;
        }
        const customer = await Customer.findById(customerId);
        if (!customer) {
            const error: any = new Error('Customer not found');
            error.statusCode = 404;
            throw error;
        }
        if (customer.isBlacklisted) {
            const error: any = new Error('Customer is blacklisted and cannot rent items');
            error.statusCode = 403;
            throw error;
        }
        const itemIds = items.map((i: any) => i.itemId);
        const inventoryItems = await Inventory.find({ _id: { $in: itemIds } });
        const notAvailable = inventoryItems.filter(i => i.status !== 'Available');       
        if (notAvailable.length > 0) {
            const error: any = new Error(`The following items are not available: ${notAvailable.map(i => i.itemName).join(', ')}`);
            error.statusCode = 400;
            throw error;
        }
        const rental = await ProductRental.create({
            customer: customerId, items, dueDate, totalAmount, paymentStatus, notes
        });
        await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Rented' } });
        await Customer.findByIdAndUpdate(customerId, { $push: { rentalHistory: rental._id } });
        return await ProductRental.findById(rental._id)
            .populate('customer')
            .populate('items.itemId');
    }

    async updateRentalStatus(id: string, status: string): Promise<IProductRental> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        rental.status = status as any;
        if (status === 'Returned') rental.returnDate = new Date();
        await rental.save();
        if (status === 'Returned') {
            const itemIds = rental.items.map(i => i.itemId);
            await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Available' } });
        }     
        return rental;
    }

    async extendDueDate(id: string, newDueDate: string): Promise<IProductRental> {
        if (!newDueDate) {
            const error: any = new Error('newDueDate is required');
            error.statusCode = 400;
            throw error;
        }
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        if (rental.status === 'Returned') {
            const error: any = new Error('Cannot extend a returned rental');
            error.statusCode = 400;
            throw error;
        }
        rental.dueDate = new Date(newDueDate);
        if (rental.status === 'Overdue') rental.status = 'Rented';
        await rental.save();
        return rental;
    }

    async updatePaymentStatus(id: string, paymentStatus: string): Promise<IProductRental> {
        const rental = await ProductRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { paymentStatus },
            { new: true, runValidators: true }
        );
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        return rental;
    }

    async archiveRental(id: string): Promise<{ message: string }> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        rental.isArchived = true;
        rental.archivedAt = new Date();
        await rental.save();
        return { message: 'Rental archived' };
    }

    async restoreRental(id: string): Promise<{ message: string }> {
        const rental = await ProductRental.findOne({ _id: id, isArchived: true });
        if (!rental) {
            const error: any = new Error('Archived rental not found');
            error.statusCode = 404;
            throw error;
        }
        rental.isArchived = false;
        rental.archivedAt = undefined;
        await rental.save();
        return { message: 'Rental restored' };
    }

    async deleteRental(id: string): Promise<{ message: string }> {
        const rental = await ProductRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Rental not found');
            error.statusCode = 404;
            throw error;
        }
        
        await ProductRental.findByIdAndDelete(id);
        if (rental.status !== 'Returned') {
            const itemIds = rental.items.map(i => i.itemId);
            await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Available' } });
        }
        return { message: 'Rental permanently deleted' };
    }

    async getArchivedRentals(): Promise<IProductRental[]> {
        return await ProductRental.find({ isArchived: true })
            .populate('customer')
            .populate('items.itemId')
            .sort({ archivedAt: -1 });
    }
}

export default new RentalService();