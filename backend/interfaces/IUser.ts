import { Types } from 'mongoose';
import { Role } from '../config/constants';

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    username: string;
    email?: string;
    password: string;
    role: Role;
    lastLogin?: Date;
    isActive: boolean;
    /** Incremented to revoke every session issued for this user (logout, password or role change). */
    tokenVersion: number;
    /** Set when an admin issues a password; the user must choose their own before using the app. */
    mustChangePassword: boolean;
    passwordChangedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/** The authenticated user attached to `req.user`. */
export interface AuthUser {
    id: string;
    name: string;
    username: string;
    email?: string;
    role: Role;
    mustChangePassword: boolean;
}
