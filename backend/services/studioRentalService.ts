import { Types } from 'mongoose';
import { z } from 'zod';
import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import Invoice from '../models/Invoice';
import RoomLock from '../models/RoomLock';
import { STUDIO_ROOMS } from '../config/constants';
import { env } from '../config/env';
import { AuthUser } from '../interfaces/IUser';
import { conflict, forbidden, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { nextDocumentNumber } from '../utils/sequence';
import { withTransaction } from '../utils/transaction';
import { createStudioBody, updateStudioBody } from '../validators/studio';

type CreateStudioInput = z.infer<typeof createStudioBody>;
type UpdateStudioInput = z.infer<typeof updateStudioBody>;

const CUSTOMER_FIELDS = 'firstName lastName phone email';

const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: env.APP_TIMEZONE, dateStyle: 'medium', timeStyle: 'short' }).format(d);

class StudioRentalService {
    rooms() {
        return STUDIO_ROOMS;
    }

    list() {
        return StudioRental.find({ isDeleted: false, isArchived: false })
            .populate('customer', CUSTOMER_FIELDS)
            .sort({ startTime: -1 })
            .lean();
    }

    listArchived() {
        return StudioRental.find({ isDeleted: false, isArchived: true })
            .populate('customer', CUSTOMER_FIELDS)
            .sort({ archivedAt: -1 })
            .lean();
    }

    async getById(id: string | Types.ObjectId) {
        const booking = await StudioRental.findOne({ _id: id, isDeleted: false }).populate('customer', CUSTOMER_FIELDS).lean();
        if (!booking) throw notFound('Studio booking');
        return booking;
    }

    async create(input: CreateStudioInput, actor: AuthUser) {
        const id = await withTransaction(async () => {
            await this.assertCustomerCanBook(input.customerId);
            const startTime = new Date(input.startTime);
            const endTime = new Date(input.endTime);
            if (input.status === 'Confirmed') await this.assertRoomFree(input.roomName, startTime, endTime);

            const booking = await StudioRental.create({
                bookingId: await nextDocumentNumber('SR'),
                customer: input.customerId,
                roomName: input.roomName,
                startTime,
                endTime,
                totalAmount: input.totalAmount,
                status: input.status,
                paymentStatus: input.paymentStatus,
                notes: input.notes,
                createdBy: actor.id,
            });
            logger.info({ event: 'studio.created', bookingId: booking.bookingId, room: booking.roomName, by: actor.id }, 'Studio booking created');
            return booking._id;
        });
        return this.getById(id);
    }

    async update(id: string, input: UpdateStudioInput, actor: AuthUser) {
        await withTransaction(async () => {
            const booking = await StudioRental.findOne({ _id: id, isDeleted: false });
            if (!booking) throw notFound('Studio booking');

            if (input.customerId && input.customerId !== booking.customer.toString()) {
                await this.assertCustomerCanBook(input.customerId);
                booking.customer = new Types.ObjectId(input.customerId);
            }
            if (input.roomName) booking.roomName = input.roomName;
            if (input.startTime) booking.startTime = new Date(input.startTime);
            if (input.endTime) booking.endTime = new Date(input.endTime);
            if (input.totalAmount !== undefined) booking.totalAmount = input.totalAmount;
            if (input.status) booking.status = input.status;
            if (input.paymentStatus) booking.paymentStatus = input.paymentStatus;
            if (input.notes !== undefined) booking.notes = input.notes;

            const scheduleChanged = booking.isModified('roomName') || booking.isModified('startTime')
                || booking.isModified('endTime') || booking.isModified('status');
            if (booking.status === 'Confirmed' && scheduleChanged) {
                await this.assertRoomFree(booking.roomName, booking.startTime, booking.endTime, booking._id);
            }

            // document.save() runs validation (end after start) and recalculates durationHours.
            await booking.save();
            logger.info({ event: 'studio.updated', bookingId: booking.bookingId, fields: Object.keys(input), by: actor.id }, 'Studio booking updated');
        });
        return this.getById(id);
    }

    async archive(id: string, actor: AuthUser) {
        const booking = await StudioRental.findOne({ _id: id, isDeleted: false });
        if (!booking) throw notFound('Studio booking');
        booking.isArchived = true;
        booking.archivedAt = new Date();
        await booking.save();
        logger.info({ event: 'studio.archived', bookingId: booking.bookingId, by: actor.id }, 'Studio booking archived');
        return { message: 'Studio booking archived' };
    }

    async restore(id: string, actor: AuthUser) {
        const booking = await StudioRental.findOne({ _id: id, isArchived: true, isDeleted: false });
        if (!booking) throw notFound('Archived studio booking');
        booking.isArchived = false;
        booking.archivedAt = undefined;
        await booking.save();
        logger.info({ event: 'studio.restored', bookingId: booking.bookingId, by: actor.id }, 'Studio booking restored');
        return { message: 'Studio booking restored' };
    }

    async remove(id: string, actor: AuthUser) {
        const booking = await StudioRental.findOne({ _id: id, isDeleted: false });
        if (!booking) throw notFound('Studio booking');
        const invoice = await Invoice.findOne({ studioRentals: booking._id }).select('invoiceId').lean();
        if (invoice) throw conflict(`This booking is billed on invoice ${invoice.invoiceId} and cannot be deleted. Archive it instead.`);

        await booking.deleteOne();
        logger.info({ event: 'studio.deleted', bookingId: booking.bookingId, by: actor.id }, 'Studio booking deleted');
        return { message: 'Studio booking permanently deleted' };
    }

    private async assertCustomerCanBook(customerId: string) {
        const customer = await Customer.findById(customerId).select('isArchived isBlacklisted').lean();
        if (!customer) throw notFound('Customer');
        if (customer.isArchived) throw conflict('This customer is archived. Restore them before booking.');
        if (customer.isBlacklisted) throw forbidden('This customer is blacklisted and cannot book the studio', 'CUSTOMER_BLACKLISTED');
    }

    /**
     * Must run inside a transaction. Bumping the room's lock document first makes concurrent
     * bookings for the same room conflict (and retry), so the overlap check below can't race.
     */
    private async assertRoomFree(roomName: string, start: Date, end: Date, excludeId?: Types.ObjectId) {
        await RoomLock.updateOne({ _id: roomName }, { $inc: { version: 1 } }, { upsert: true });

        const clash = await StudioRental.findOne({
            roomName,
            isDeleted: false,
            status: 'Confirmed',
            startTime: { $lt: end },
            endTime: { $gt: start },
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).select('bookingId startTime endTime').lean();

        if (clash) {
            throw conflict(`${roomName} is already booked from ${fmtTime(clash.startTime)} to ${fmtTime(clash.endTime)} (${clash.bookingId})`);
        }
    }
}

export default new StudioRentalService();
