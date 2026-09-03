import { Document, Types } from 'mongoose';

export type ProductRentalStatus = 'Rented' | 'Returned' | 'Overdue';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface IRentalItem {
    itemId: Types.ObjectId;
    quantity: number;
}

export interface IProductRental extends Document {
    rentalId: string;
    customer: Types.ObjectId;
    items: IRentalItem[];
    rentalDate: Date;
    dueDate: Date;
    returnDate?: Date;
    status: ProductRentalStatus;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    notes?: string;
    isDeleted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
