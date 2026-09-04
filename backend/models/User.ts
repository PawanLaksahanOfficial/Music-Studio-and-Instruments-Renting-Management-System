import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../interfaces/IUser';

const BCRYPT_ROUNDS = 12;

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true, trim: true },
        username: { type: String, unique: true, required: true, trim: true, lowercase: true },
        email: { type: String, trim: true, lowercase: true },
        // Excluded by default so a stray `User.find()` cannot leak hashes.
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ['Admin', 'Cashier'], default: 'Cashier' },
        lastLogin: Date,
        isActive: { type: Boolean, default: true },
        mustChangePassword: { type: Boolean, default: false },
        passwordChangedAt: Date,
        resetTokenHash: { type: String, select: false },
        resetTokenExpiresAt: { type: Date, select: false },
    },
    { timestamps: true }
);

UserSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
    // Backdated one second: a token minted in the same second as the change
    // would otherwise be rejected by the passwordChangedAt check.
    this.passwordChangedAt = new Date(Date.now() - 1000);
});

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

UserSchema.index({ isActive: 1, createdAt: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
