import mongoose, { Schema, Model } from 'mongoose';
import { IProductRental } from '../interfaces/IProductRental';

const ProductRentalSchema: Schema<IProductRental> = new Schema({
    rentalId: { type: String, unique: true, default: () => `PR-${Date.now()}` },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        quantity: { type: Number, default: 1 }
    }],
    rentalDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: Date,
    status: { type: String, enum: ['Rented', 'Returned', 'Overdue'], default: 'Rented' },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
    lateFee: { type: Number, default: 0, min: 0 },
    damageCharges: { type: Number, default: 0, min: 0 },
    damageNotes: { type: String, default: '' },
    notes: String,
    isDeleted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date }
}, { timestamps: true });

const ProductRental: Model<IProductRental> = mongoose.models.ProductRental || mongoose.model<IProductRental>('ProductRental', ProductRentalSchema);
export default ProductRental;
