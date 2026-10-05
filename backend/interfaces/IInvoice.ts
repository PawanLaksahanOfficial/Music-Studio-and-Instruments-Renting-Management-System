import { Types } from 'mongoose';
import { INVOICE_LINE_KINDS, PAYMENT_METHODS, SIMPLE_PAYMENT_STATUSES } from '../config/constants';

export type InvoiceLineKind = (typeof INVOICE_LINE_KINDS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type InvoicePaymentStatus = (typeof SIMPLE_PAYMENT_STATUSES)[number];

export interface IInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    /** Revenue category used by statistics. Missing on invoices created before this field existed. */
    kind?: InvoiceLineKind;
}

export interface IInvoice {
    _id: Types.ObjectId;
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
    paidAt?: Date;
    createdBy: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
