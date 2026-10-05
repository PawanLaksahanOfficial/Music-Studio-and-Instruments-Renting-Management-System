import bcrypt from 'bcryptjs';
import User, { BCRYPT_ROUNDS } from '../models/User';
import { AppError, badRequest, notFound, unauthorized } from '../utils/AppError';
import { logger } from '../utils/logger';
import { signSessionToken } from './tokenService';
import { IUser } from '../interfaces/IUser';

type UserLike = Pick<IUser, '_id' | 'name' | 'username' | 'email' | 'role' | 'mustChangePassword'> & Partial<Pick<IUser, 'isActive' | 'lastLogin' | 'createdAt'>>;

/** The user fields that are safe to send to the browser. */
export const toPublicUser = (user: UserLike) => ({
    _id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
});

// Compared against when the username doesn't exist, so response time doesn't reveal which usernames are valid.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('timing-equalizer-not-a-real-password', BCRYPT_ROUNDS));

class AuthService {
    async login(username: string, password: string, ip?: string) {
        const normalized = username.trim().toLowerCase();
        const user = await User.findOne({ username: normalized }).select('+password');
        const passwordMatches = await bcrypt.compare(password, user?.password ?? (await getDummyHash()));

        if (!user || !passwordMatches) {
            logger.warn({ event: 'auth.login_failed', username: normalized, ip }, 'Failed login attempt');
            throw unauthorized('Invalid username or password');
        }
        // Only revealed after the correct password, so it can't be used to discover accounts.
        if (!user.isActive) {
            logger.warn({ event: 'auth.login_inactive', userId: user.id, ip }, 'Login attempt on deactivated account');
            throw new AppError(403, 'This account has been deactivated. Please contact an administrator.', 'ACCOUNT_DISABLED');
        }

        await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
        logger.info({ event: 'auth.login_success', userId: user.id, role: user.role, ip }, 'User signed in');

        return { user: toPublicUser(user), token: signSessionToken(user) };
    }

    async getMe(userId: string) {
        const user = await User.findById(userId).lean();
        if (!user) throw notFound('User');
        return toPublicUser(user);
    }

    /** Ends every session of the user by bumping tokenVersion. */
    async logout(userId: string) {
        await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
        logger.info({ event: 'auth.logout', userId }, 'User signed out');
    }

    /** Changes the user's password, revokes other sessions and returns a fresh token for this one. */
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await User.findById(userId).select('+password');
        if (!user) throw notFound('User');

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            logger.warn({ event: 'auth.password_change_failed', userId }, 'Wrong current password on password change');
            throw badRequest('Your current password is incorrect');
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        user.tokenVersion += 1;
        await user.save();
        logger.info({ event: 'auth.password_changed', userId }, 'Password changed');

        return { user: toPublicUser(user), token: signSessionToken(user) };
    }
}

export default new AuthService();
