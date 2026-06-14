import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../interfaces/IUser';

const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, required: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Cashier'], default: 'Cashier' },
    lastLogin: Date,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function () {
    if (this.isModified('password'))
    {
        this.password = await bcrypt.hash(this.password, 12);
    }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
