import { Document, Types } from 'mongoose';

export interface IInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
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
    tax: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: InvoicePaymentStatus;
    createdBy: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
