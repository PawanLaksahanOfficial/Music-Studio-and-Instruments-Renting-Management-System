import { ClientSession, Types } from 'mongoose';
import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import Room from '../models/Room';
import { nextSequence, formatId } from '../models/Counter';
import { IStudioRental } from '../interfaces/IStudioRental';
import { badRequest, conflict, forbidden, notFound } from '../utils/AppError';
import { withTransaction } from '../utils/transaction';
import { paginate, searchFilter, Paginated } from '../utils/paginate';
import { quoteStudioRental } from '../utils/pricing';

const POPULATE = [{ path: 'customer' }, { path: 'room' }];

interface BookingInput {
    customerId: string;
    roomId: string;
    startTime: Date;
    endTime: Date;
    paymentStatus?: 'Paid' | 'Pending';
    notes?: string;
}

/**
 * Two intervals overlap when each starts before the other ends. Booking
 * boundaries touch legally, so a 10:00–12:00 slot does not block 12:00–14:00.
 */
const overlapFilter = (roomId: string | Types.ObjectId, start: Date, end: Date, excludeId?: string) => ({
    room: roomId,
    isDeleted: false,
    status: 'Confirmed',
    startTime: { $lt: end },
    endTime: { $gt: start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
});

class StudioRentalService {
    async getAllStudioRentals(opts: { page: number; limit: number; search?: string; status?: string }): Promise<Paginated<IStudioRental>> {
        const filter: Record<string, unknown> = { isDeleted: false, isArchived: false };
        if (opts.status && opts.status !== 'All') filter.status = opts.status;
        if (opts.search) Object.assign(filter, searchFilter(opts.search, ['bookingId', 'roomName']));

        return paginate(StudioRental, {
            filter,
            page: opts.page,
            limit: opts.limit,
            sort: { startTime: -1 },
            populate: POPULATE,
        });
    }

    async getArchivedStudioRentals(opts: { page: number; limit: number }) {
        return paginate(StudioRental, {
            filter: { isArchived: true },
            page: opts.page,
            limit: opts.limit,
            sort: { archivedAt: -1 },
            populate: POPULATE,
        });
    }

    async getStudioRentalById(id: string): Promise<IStudioRental> {
        const rental = await StudioRental.findOne({ _id: id, isDeleted: false }).populate(POPULATE);
        if (!rental) throw notFound('Studio rental not found');
        return rental;
    }

    /** Bookings for a room in a window — backs the availability calendar. */
    async getRoomAvailability(roomId: string, from: Date, to: Date) {
        const room = await Room.findById(roomId);
        if (!room) throw notFound('Room not found');

        const bookings = await StudioRental.find({
            room: roomId,
            isDeleted: false,
            status: 'Confirmed',
            startTime: { $lt: to },
            endTime: { $gt: from },
        })
            .select('bookingId startTime endTime status customer')
            .populate('customer', 'firstName lastName')
            .sort({ startTime: 1 })
            .lean();

        return { room: { _id: room._id, name: room.name, hourlyRate: room.hourlyRate }, bookings };
    }

    private validateWindow(startTime: Date, endTime: Date) {
        if (endTime <= startTime) throw badRequest('End time must be after start time');
        const hours = (endTime.getTime() - startTime.getTime()) / 3_600_000;
        if (hours > 24) throw badRequest('A single booking cannot exceed 24 hours');
    }

    /**
     * The conflict check and the insert run in one transaction, so two clerks
     * booking the same slot simultaneously cannot both pass the check.
     */
    async createStudioRental(input: BookingInput): Promise<IStudioRental | null> {
        this.validateWindow(input.startTime, input.endTime);

        const id = await withTransaction(async session => {
            const [customer, room] = await Promise.all([
                Customer.findById(input.customerId).session(session),
                Room.findById(input.roomId).session(session),
            ]);
            if (!customer) throw notFound('Customer not found');
            if (customer.isBlacklisted) throw forbidden('Customer is blacklisted');
            if (!room) throw notFound('Room not found');
            if (!room.isActive) throw badRequest(`${room.name} is not currently bookable`);

            const clash = await StudioRental.findOne(
                overlapFilter(room._id as Types.ObjectId, input.startTime, input.endTime)
            ).session(session);
            if (clash) {
                throw conflict(`${room.name} is already booked from ${clash.startTime.toISOString()} to ${clash.endTime.toISOString()}`);
            }

            // Priced from the room's stored rate, never from the request body.
            const { durationHours, baseAmount } = quoteStudioRental(room.hourlyRate, input.startTime, input.endTime);
            const seq = await nextSequence('studioRental', session);

            const [booking] = await StudioRental.create(
                [
                    {
                        bookingId: formatId('SR', seq),
                        customer: input.customerId,
                        room: room._id,
                        roomName: room.name,
                        startTime: input.startTime,
                        endTime: input.endTime,
                        durationHours,
                        hourlyRate: room.hourlyRate,
                        totalAmount: baseAmount,
                        paymentStatus: input.paymentStatus ?? 'Pending',
                        notes: input.notes,
                    },
                ],
                { session }
            );
            return booking._id;
        });

        return StudioRental.findById(id).populate(POPULATE);
    }

    /**
     * Re-runs the conflict check on every change to the room or the time
     * window. The previous implementation only checked on create, so editing
     * a booking's times could silently double-book a room.
     */
    async updateStudioRental(
        id: string,
        updates: Partial<Pick<BookingInput, 'roomId' | 'startTime' | 'endTime' | 'paymentStatus' | 'notes'>> & { status?: string }
    ): Promise<IStudioRental | null> {
        const updatedId = await withTransaction(async session => {
            const booking = await StudioRental.findOne({ _id: id, isDeleted: false }).session(session);
            if (!booking) throw notFound('Studio rental not found');

            const startTime = updates.startTime ?? booking.startTime;
            const endTime = updates.endTime ?? booking.endTime;
            const roomChanged = updates.roomId && String(updates.roomId) !== String(booking.room);
            const timeChanged =
                startTime.getTime() !== booking.startTime.getTime() || endTime.getTime() !== booking.endTime.getTime();

            if (roomChanged || timeChanged) {
                this.validateWindow(startTime, endTime);

                const room = roomChanged
                    ? await Room.findById(updates.roomId).session(session)
                    : await Room.findById(booking.room).session(session);
                if (!room) throw notFound('Room not found');
                if (!room.isActive) throw badRequest(`${room.name} is not currently bookable`);

                const clash = await StudioRental.findOne(
                    overlapFilter(room._id as Types.ObjectId, startTime, endTime, id)
                ).session(session);
                if (clash) throw conflict(`${room.name} is already booked during that time slot`);

                const { durationHours, baseAmount } = quoteStudioRental(room.hourlyRate, startTime, endTime);
                booking.room = room._id as Types.ObjectId;
                booking.roomName = room.name;
                booking.startTime = startTime;
                booking.endTime = endTime;
                booking.durationHours = durationHours;
                booking.hourlyRate = room.hourlyRate;
                booking.totalAmount = baseAmount;
            }

            if (updates.paymentStatus) booking.paymentStatus = updates.paymentStatus;
            if (updates.status) booking.status = updates.status as IStudioRental['status'];
            if (updates.notes !== undefined) booking.notes = updates.notes;

            await booking.save({ session });
            return booking._id;
        });

        return StudioRental.findById(updatedId).populate(POPULATE);
    }

    async updateStudioStatus(id: string, status: string): Promise<IStudioRental> {
        const rental = await StudioRental.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { status },
            { returnDocument: 'after', runValidators: true }
        ).populate(POPULATE);
        if (!rental) throw notFound('Studio rental not found');
        return rental;
    }

    async archiveStudioRental(id: string) {
        const rental = await StudioRental.findOne({ _id: id, isDeleted: false });
        if (!rental) throw notFound('Studio rental not found');
        if (rental.status === 'Confirmed') {
            throw badRequest('Complete or cancel the booking before archiving it');
        }
        rental.isArchived = true;
        rental.archivedAt = new Date();
        await rental.save({ validateModifiedOnly: true });
        return { message: 'Studio rental archived' };
    }

    async restoreStudioRental(id: string) {
        const rental = await StudioRental.findOne({ _id: id, isArchived: true });
        if (!rental) throw notFound('Archived studio rental not found');
        rental.isArchived = false;
        rental.archivedAt = undefined;
        await rental.save({ validateModifiedOnly: true });
        return { message: 'Studio rental restored' };
    }

    async deleteStudioRental(id: string) {
        const result = await StudioRental.findOneAndDelete({ _id: id, isDeleted: false });
        if (!result) throw notFound('Studio rental not found');
        return { message: 'Studio rental permanently deleted' };
    }

    /** Marks past confirmed bookings complete. Called by the scheduled job. */
    async completePastBookings(session?: ClientSession) {
        const result = await StudioRental.updateMany(
            { status: 'Confirmed', endTime: { $lt: new Date() }, isDeleted: false },
            { $set: { status: 'Completed' } },
            { session }
        );
        return result.modifiedCount;
    }
}

export default new StudioRentalService();
