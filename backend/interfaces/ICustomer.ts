import { Document, Types } from 'mongoose';

export interface ICustomer extends Document {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nicOrPassport: string;
    rentalHistory: Types.ObjectId[];
    isBlacklisted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
