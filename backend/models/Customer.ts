import mongoose, { Schema, Model } from 'mongoose';
import { ICustomer } from '../interfaces/ICustomer';

const CustomerSchema: Schema<ICustomer> = new Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, sparse: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        address: String,
        nicOrPassport: { type: String, unique: true, required: true, trim: true },
        rentalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
        isBlacklisted: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
    },
    { timestamps: true }
);

CustomerSchema.index({ isArchived: 1, createdAt: -1 });
CustomerSchema.index({ isArchived: 1, archivedAt: -1 });
CustomerSchema.index({ firstName: 'text', lastName: 'text', phone: 'text', nicOrPassport: 'text' });

const Customer: Model<ICustomer> =
    mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;
