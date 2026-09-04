import mongoose, { Schema, Model } from 'mongoose';
import { IInvoice } from '../interfaces/IInvoice';

const InvoiceItemSchema = new Schema(
    {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
        sourceType: {
            type: String,
            enum: ['ProductRental', 'StudioRental', 'Manual'],
            default: 'Manual',
            required: true,
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId },
    },
    { _id: false }
);

const InvoiceSchema: Schema<IInvoice> = new Schema(
    {
        // Assigned from an atomic counter in the service layer.
        invoiceId: { type: String, unique: true, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        productRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
        studioRentals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudioRental' }],
        items: { type: [InvoiceItemSchema], required: true },
        subtotal: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0, min: 0, max: 100 },
        tax: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, enum: ['Cash', 'Card', 'Transfer'], required: true },
        paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
        paidAt: Date,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        notes: String,
    },
    { timestamps: true }
);

InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ customer: 1, createdAt: -1 });
// Revenue reporting filters by status and buckets by payment date.
InvoiceSchema.index({ paymentStatus: 1, paidAt: -1 });

const Invoice: Model<IInvoice> =
    mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;
