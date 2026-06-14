import mongoose, { Schema, Model } from 'mongoose';
import { ICustomer } from '../interfaces/ICustomer';

const CustomerSchema: Schema<ICustomer> = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    address: String,
    nicOrPassport: { type: String, unique: true, required: true, trim: true },
    rentalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
    isBlacklisted: { type: Boolean, default: false }
}, { timestamps: true });

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;
