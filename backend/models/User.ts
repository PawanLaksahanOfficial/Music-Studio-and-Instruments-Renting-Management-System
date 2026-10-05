import mongoose, { Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../interfaces/IUser';
import { ROLES } from '../config/constants';

export const BCRYPT_ROUNDS = 12;

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, unique: true, required: true, trim: true, lowercase: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    // Never returned by queries unless explicitly requested with .select('+password').
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'Cashier' },
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: Date,
}, { timestamps: true });

UserSchema.index({ role: 1, isActive: 1 });

UserSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
        if (!this.isNew) this.passwordChangedAt = new Date();
    }
});

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export default User;
