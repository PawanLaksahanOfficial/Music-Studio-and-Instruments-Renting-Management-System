import { Document, Types } from 'mongoose';

export type StudioRentalStatus = 'Confirmed' | 'Cancelled' | 'Completed';
export type StudioPaymentStatus = 'Paid' | 'Pending';

export interface IStudioRental extends Document {
    bookingId: string;
    customer: Types.ObjectId;
    roomName: string;
    startTime: Date;
    endTime: Date;
    durationHours?: number;
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