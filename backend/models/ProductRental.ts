import mongoose, { Model, Schema } from 'mongoose';
import { IProductRental } from '../interfaces/IProductRental';
import { PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES, RENTAL_STATUSES } from '../config/constants';

const ProductRentalSchema = new Schema<IProductRental>({
    rentalId: { type: String, unique: true, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        _id: false,
        itemId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        dailyRate: { type: Number, min: 0 },
    }],
    rentalDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: Date,
    status: { type: String, enum: RENTAL_STATUSES, default: 'Rented' },
    baseAmount: { type: Number, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: RENTAL_PAYMENT_STATUSES, default: 'Pending' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    lateFee: { type: Number, default: 0, min: 0 },
    damageCharges: { type: Number, default: 0, min: 0 },
    damageNotes: { type: String, default: '', trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 1000 },
    remindersSent: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    returnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, { timestamps: true });

ProductRentalSchema.index({ status: 1, dueDate: 1 });
ProductRentalSchema.index({ customer: 1, createdAt: -1 });
ProductRentalSchema.index({ 'items.itemId': 1, status: 1 });
ProductRentalSchema.index({ isDeleted: 1, isArchived: 1, createdAt: -1 });

const ProductRental = (mongoose.models.ProductRental as Model<IProductRental>)
    || mongoose.model<IProductRental>('ProductRental', ProductRentalSchema);
export default ProductRental;
