import { Document, Types } from 'mongoose';

export type StudioRentalStatus = 'Confirmed' | 'Cancelled' | 'Completed';
export type StudioPaymentStatus = 'Paid' | 'Pending';

export interface IStudioRental extends Document {
    bookingId: string;
    customer: Types.ObjectId;
    room: Types.ObjectId;
    /** Room name captured at booking time, so a later rename does not rewrite history. */
    roomName: string;
    startTime: Date;
    endTime: Date;
    durationHours: number;
    /** Hourly rate captured at booking time. */
    hourlyRate: number;
    totalAmount: number;
    status: StudioRentalStatus;
    paymentStatus: StudioPaymentStatus;
    notes?: string;
    isDeleted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
