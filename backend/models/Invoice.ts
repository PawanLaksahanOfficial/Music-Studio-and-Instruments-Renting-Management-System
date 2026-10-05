import mongoose, { Model, Schema } from 'mongoose';
import { IInvoice, IInvoiceItem } from '../interfaces/IInvoice';
import { INVOICE_LINE_KINDS, PAYMENT_METHODS, SIMPLE_PAYMENT_STATUSES } from '../config/constants';

const InvoiceItemSchema = new Schema<IInvoiceItem>({
    description: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: INVOICE_LINE_KINDS },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
    invoiceId: { type: String, unique: true, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productRentals: [{ type: Schema.Types.ObjectId, ref: 'ProductRental' }],
    studioRentals: [{ type: Schema.Types.ObjectId, ref: 'StudioRental' }],
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: SIMPLE_PAYMENT_STATUSES, default: 'Pending' },
    paidAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

InvoiceSchema.index({ customer: 1, createdAt: -1 });
InvoiceSchema.index({ paymentStatus: 1, paidAt: -1 });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ productRentals: 1 });
InvoiceSchema.index({ studioRentals: 1 });

const Invoice = (mongoose.models.Invoice as Model<IInvoice>) || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;
