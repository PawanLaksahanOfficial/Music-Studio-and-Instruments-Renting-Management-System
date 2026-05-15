const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
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

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);