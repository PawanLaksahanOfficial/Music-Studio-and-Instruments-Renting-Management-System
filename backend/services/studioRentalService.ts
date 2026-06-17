import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import { IStudioRental } from '../interfaces/IStudioRental';

class StudioRentalService {
    async getAllStudioRentals(): Promise<IStudioRental[]> {
        return await StudioRental.find({ isDeleted: false, isArchived: false })
            .populate('customer')
            .sort({ startTime: -1 });
    }

    async getStudioRentalById(id: string): Promise<IStudioRental> {
        const rental = await StudioRental.findOne({ _id: id, isDeleted: false })
            .populate('customer');
        if (!rental) {
            const error: any = new Error('Studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        return rental;
    }

    async createStudioRental(data: any): Promise<IStudioRental | null> {
        const { customerId, roomName, startTime, endTime, totalAmount, paymentStatus, notes } = data;
        
        if (!customerId || !roomName || !startTime || !endTime || totalAmount === undefined) {
            const error: any = new Error('customerId, roomName, startTime, endTime and totalAmount are required');
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
            const error: any = new Error('Customer is blacklisted');
            error.statusCode = 403;
            throw error;
        }

        const conflict = await StudioRental.findOne({
            roomName,
            isDeleted: false,
            status: { $in: ['Confirmed'] },
            $or: [
                { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
                { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
                { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(endTime) } }
            ]
        });

        if (conflict) {
            const error: any = new Error(`${roomName} is already booked during that time slot`);
            error.statusCode = 409;
            throw error;
        }

        const rental = await StudioRental.create({
            customer: customerId, roomName, startTime, endTime,
            totalAmount, paymentStatus, notes
        });

        return await StudioRental.findById(rental._id).populate('customer');
    }

    async updateStudioRental(id: string, updateData: any): Promise<IStudioRental> {
        const allowed = ['roomName', 'startTime', 'endTime', 'totalAmount', 'status', 'paymentStatus', 'notes', 'customerId'];
        const updates: any = {};
        allowed.forEach(f => {
            if (updateData[f] !== undefined) {
                updates[f === 'customerId' ? 'customer' : f] = updateData[f];
            }
        });

        const rental = await StudioRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updates,
            { new: true, runValidators: true }
        ).populate('customer');

        if (!rental) {
            const error: any = new Error('Studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        return rental as IStudioRental;
    }

    async updateStudioStatus(id: string, status: string): Promise<IStudioRental> {
        const rental = await StudioRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { status },
            { new: true }
        );
        if (!rental) {
            const error: any = new Error('Studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        return rental;
    }

    async archiveStudioRental(id: string): Promise<{ message: string }> {
        const rental = await StudioRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        rental.isArchived = true;
        rental.archivedAt = new Date();
        await rental.save();
        return { message: 'Studio rental archived' };
    }

    async restoreStudioRental(id: string): Promise<{ message: string }> {
        const rental = await StudioRental.findOne({ _id: id, isArchived: true });
        if (!rental) {
            const error: any = new Error('Archived studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        rental.isArchived = false;
        rental.archivedAt = undefined;
        await rental.save();
        return { message: 'Studio rental restored' };
    }

    async deleteStudioRental(id: string): Promise<{ message: string }> {
        const rental = await StudioRental.findOne({ _id: id, isDeleted: false });
        if (!rental) {
            const error: any = new Error('Studio rental not found');
            error.statusCode = 404;
            throw error;
        }
        await StudioRental.findByIdAndDelete(id);
        return { message: 'Studio rental permanently deleted' };
    }

    async getArchivedStudioRentals(): Promise<IStudioRental[]> {
        return await StudioRental.find({ isArchived: true })
            .populate('customer')
            .sort({ archivedAt: -1 });
    }
}

export default new StudioRentalService();