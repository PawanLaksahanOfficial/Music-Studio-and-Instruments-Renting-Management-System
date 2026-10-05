import { Types } from 'mongoose';

export interface ICustomer {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nicOrPassport: string;
    isBlacklisted: boolean;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
