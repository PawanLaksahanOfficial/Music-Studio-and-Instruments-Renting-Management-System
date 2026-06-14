import { Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    username: string;
    email?: string;
    password: string;
    role: 'Admin' | 'Cashier';
    lastLogin?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
