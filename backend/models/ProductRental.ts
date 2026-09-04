import mongoose, { Schema, Model } from 'mongoose';
import { IProductRental } from '../interfaces/IProductRental';

const RentalItemSchema = new Schema(
    {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        dailyRate: { type: Number, required: true, min: 0 },
        isDamaged: { type: Boolean, default: false },
        damageCharge: { type: Number, default: 0, min: 0 },
        damageNote: { type: String, trim: true },
    },
    { _id: false }
);

const ProductRentalSchema: Schema<IProductRental> = new Schema(
    {
        // Assigned from an atomic counter in the service layer.
        rentalId: { type: String, unique: true, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        items: { type: [RentalItemSchema], required: true },
        rentalDate: { type: Date, default: Date.now },
        dueDate: { type: Date, required: true },
        returnDate: Date,
        status: { type: String, enum: ['Rented', 'Returned', 'Overdue'], default: 'Rented' },
        baseAmount: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
        lateFee: { type: Number, default: 0, min: 0 },
        damageCharges: { type: Number, default: 0, min: 0 },
        damageNotes: { type: String, default: '' },
        notes: String,
        lastReminderSentAt: Date,
        remindersSent: { type: [String], default: [] },
        isDeleted: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
    },
    { timestamps: true }
);

// Every list view filters on these three, then sorts by createdAt.
ProductRentalSchema.index({ isDeleted: 1, isArchived: 1, createdAt: -1 });
ProductRentalSchema.index({ customer: 1, createdAt: -1 });
ProductRentalSchema.index({ status: 1, dueDate: 1 });
ProductRentalSchema.index({ 'items.itemId': 1, status: 1 });
ProductRentalSchema.index({ isArchived: 1, archivedAt: -1 });

const ProductRental: Model<IProductRental> =
    mongoose.models.ProductRental || mongoose.model<IProductRental>('ProductRental', ProductRentalSchema);
export default ProductRental;
