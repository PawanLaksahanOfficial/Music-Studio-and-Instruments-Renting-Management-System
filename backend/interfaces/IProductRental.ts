import { Document, Types } from 'mongoose';

export type ProductRentalStatus = 'Rented' | 'Returned' | 'Overdue';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface IRentalItem {
    itemId: Types.ObjectId;
    quantity: number;
    /** Daily rate captured at checkout, so later price changes never rewrite history. */
    dailyRate: number;
    isDamaged: boolean;
    damageCharge: number;
    damageNote?: string;
}

export interface IProductRental extends Document {
    rentalId: string;
    customer: Types.ObjectId;
    items: IRentalItem[];
    rentalDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: ProductRentalStatus;
    /** Rental price at checkout, excluding late and damage fees. Never overwritten. */
    baseAmount: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    notes?: string;
    lastReminderSentAt?: Date;
    /** Reminder keys already sent (e.g. 'due-tomorrow'), so a restart cannot re-send. */
    remindersSent: string[];
    isDeleted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
