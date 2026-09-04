import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../interfaces/IUser';
import { env } from '../config/env';
import { unauthorized, forbidden, badRequest } from '../utils/AppError';

export interface PublicUser {
    _id: unknown;
    name: string;
    username: string;
    email?: string;
    role: string;
    mustChangePassword: boolean;
}

export const toPublicUser = (user: IUser): PublicUser => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
});

class AuthService {
    signToken(user: IUser): string {
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
        return jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, options);
    }

    async login(username: string, password: string) {
        // `password` is select:false on the model, so it must be requested.
        const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

        // Same message and roughly the same work for "no such user" and "wrong
        // password", so the response cannot be used to enumerate usernames.
        if (!user) {
            throw unauthorized('Invalid credentials');
        }
        if (!(await user.comparePassword(password))) {
            throw unauthorized('Invalid credentials');
        }
        if (!user.isActive) {
            throw forbidden('Account is deactivated. Contact an administrator.');
        }

        user.lastLogin = new Date();
        await user.save({ validateModifiedOnly: true });

        return { token: this.signToken(user), user: toPublicUser(user) };
    }

    async getMe(user: IUser) {
        return toPublicUser(user);
    }

    /**
     * Self-service password change. Requires the current password, so a stolen
     * token alone cannot lock the real owner out of their account.
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await User.findById(userId).select('+password');
        if (!user) throw unauthorized('User not found');

        if (!(await user.comparePassword(currentPassword))) {
            throw unauthorized('Current password is incorrect');
        }
        if (await user.comparePassword(newPassword)) {
            throw badRequest('New password must be different from the current one');
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        user.resetTokenHash = undefined;
        user.resetTokenExpiresAt = undefined;
        await user.save();

        // Issue a fresh token — the change invalidated the caller's current one.
        return { token: this.signToken(user), user: toPublicUser(user) };
    }
}

export default new AuthService();
