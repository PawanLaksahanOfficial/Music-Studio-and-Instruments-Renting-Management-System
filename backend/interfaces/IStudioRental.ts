import { Types } from 'mongoose';
import { SIMPLE_PAYMENT_STATUSES, STUDIO_STATUSES } from '../config/constants';

export type StudioRentalStatus = (typeof STUDIO_STATUSES)[number];
export type StudioPaymentStatus = (typeof SIMPLE_PAYMENT_STATUSES)[number];

export interface IStudioRental {
    _id: Types.ObjectId;
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
    createdBy?: Types.ObjectId;
    isDeleted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
