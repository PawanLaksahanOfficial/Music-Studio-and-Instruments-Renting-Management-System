import mongoose, { Schema, Model } from 'mongoose';
import { IInvoice } from '../interfaces/IInvoice';

const InvoiceItemSchema = new Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoiceSchema: Schema<IInvoice> = new Schema({
    invoiceId: { type: String, unique: true, default: () => `INV-${Date.now()}` },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    productRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
    studioRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudioRental' }],
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'Transfer'], required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String
}, { timestamps: true });

const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;
