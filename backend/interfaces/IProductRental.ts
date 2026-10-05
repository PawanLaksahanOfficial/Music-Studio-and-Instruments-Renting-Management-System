import { Types } from 'mongoose';
import { PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES, RENTAL_STATUSES } from '../config/constants';

export type ProductRentalStatus = (typeof RENTAL_STATUSES)[number];
export type PaymentStatus = (typeof RENTAL_PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IRentalItem {
    itemId: Types.ObjectId;
    quantity: number;
    /** Daily rate snapshot at checkout, so later price changes don't alter this rental. */
    dailyRate?: number;
}

export interface IProductRental {
    _id: Types.ObjectId;
    rentalId: string;
    customer: Types.ObjectId;
    items: IRentalItem[];
    rentalDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: ProductRentalStatus;
    /** Rental charge for the booked period (days x daily rates), computed by the server. */
    baseAmount?: number;
    /** baseAmount + lateFee + damageCharges once returned. */
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    notes?: string;
    /** Keys of reminders already sent ("due_today:2026-10-05"), so reminders are never duplicated. */
    remindersSent: string[];
    createdBy?: Types.ObjectId;
    returnedBy?: Types.ObjectId;
    isDeleted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
