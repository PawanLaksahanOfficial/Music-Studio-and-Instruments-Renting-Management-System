import { Document, Types } from 'mongoose';

/**
 * What a line refers to. Revenue reporting keys off this field — previously it
 * was inferred by substring-matching the description, so renaming a line item
 * silently moved money between revenue categories.
 */
export type InvoiceLineSource = 'ProductRental' | 'StudioRental' | 'Manual';

export interface IInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sourceType: InvoiceLineSource;
    sourceId?: Types.ObjectId;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Transfer';
export type InvoicePaymentStatus = 'Paid' | 'Pending';

export interface IInvoice extends Document {
    invoiceId: string;
    customer: Types.ObjectId;
    productRentals: Types.ObjectId[];
    studioRentals: Types.ObjectId[];
    items: IInvoiceItem[];
    subtotal: number;
    /** Percentage applied to the subtotal, retained so tax can be recomputed. */
    taxRate: number;
    tax: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: InvoicePaymentStatus;
    paidAt?: Date;
    createdBy: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
