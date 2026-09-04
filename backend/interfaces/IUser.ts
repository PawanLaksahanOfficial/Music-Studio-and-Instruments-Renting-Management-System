import { Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    username: string;
    email?: string;
    password: string;
    role: 'Admin' | 'Cashier';
    lastLogin?: Date;
    isActive: boolean;
    /** Forces a password change on next login — set for seeded and admin-reset accounts. */
    mustChangePassword: boolean;
    /** Tokens issued before this instant are rejected, so a password change logs out old sessions. */
    passwordChangedAt?: Date;
    /** SHA-256 of the emailed set-password token; the raw token is never stored. */
    resetTokenHash?: string;
    resetTokenExpiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}
