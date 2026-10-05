import mongoose, { Model, Schema } from 'mongoose';
import { ICustomer } from '../interfaces/ICustomer';

const CustomerSchema = new Schema<ICustomer>({
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 200 },
    nicOrPassport: { type: String, unique: true, required: true, trim: true, uppercase: true, maxlength: 20 },
    isBlacklisted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, { timestamps: true });

CustomerSchema.index({ isArchived: 1, createdAt: -1 });

const Customer = (mongoose.models.Customer as Model<ICustomer>) || mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;
