import crypto from 'crypto';
import User from '../models/User';
import { IUser } from '../interfaces/IUser';
import { notifications } from './notifications';
import { badRequest, conflict, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const publicFields = (user: IUser) => ({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
});

/** Only the SHA-256 digest is stored, so a database read cannot yield a usable token. */
const hashToken = (raw: string) => crypto.createHash('sha256').update(raw).digest('hex');

class UserService {
    async getAllUsers() {
        const users = await User.find().sort({ createdAt: -1 });
        return users.map(publicFields);
    }

    async createUser(data: { name: string; username: string; password: string; role?: string; email?: string }) {
        const { name, username, password, role, email } = data;

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) throw conflict('Username already taken');

        const user = await User.create({
            name,
            username,
            password,
            role,
            email,
            // A password chosen by an admin is a shared secret until the owner
            // replaces it, so the first login forces a change.
            mustChangePassword: true,
        });
        return publicFields(user);
    }

    async updateUser(id: string, updateData: { name?: string; role?: string; email?: string; isActive?: boolean }) {
        const user = await User.findById(id);
        if (!user) throw notFound('User not found');

        // Passwords are deliberately not updatable here — an admin issues a
        // reset link instead, so no one but the owner ever knows the value.
        if (updateData.name !== undefined) user.name = updateData.name;
        if (updateData.role !== undefined) user.role = updateData.role as IUser['role'];
        if (updateData.email !== undefined) user.email = updateData.email;
        if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

        await user.save();
        return publicFields(user);
    }

    async toggleActive(id: string) {
        const user = await User.findById(id);
        if (!user) throw notFound('User not found');
        user.isActive = !user.isActive;
        await user.save({ validateModifiedOnly: true });
        return { isActive: user.isActive };
    }

    async deleteUser(id: string, actingUserId: string) {
        if (id === actingUserId) throw badRequest('You cannot delete your own account');

        const target = await User.findById(id);
        if (!target) throw notFound('User not found');

        if (target.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin', isActive: true });
            if (adminCount <= 1) throw badRequest('Cannot delete the last active administrator');
        }

        await User.findByIdAndDelete(id);
        return { message: 'User deleted' };
    }

    /**
     * Emails a single-use, expiring link the user follows to set their own
     * password. Replaces mailing the password in clear text, which left a
     * usable credential sitting in an inbox indefinitely.
     */
    async sendPasswordSetupLink(userId: string, appBaseUrl: string) {
        const user = await User.findById(userId);
        if (!user) throw notFound('User not found');
        if (!user.email) throw badRequest('User does not have an email address');

        const rawToken = crypto.randomBytes(32).toString('hex');
        user.resetTokenHash = hashToken(rawToken);
        user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        user.mustChangePassword = true;
        await user.save({ validateModifiedOnly: true });

        const link = `${appBaseUrl.replace(/\/$/, '')}/set-password?token=${rawToken}&user=${String(user._id)}`;
        const result = await notifications.sendEmail(
            user.email,
            'Set your ELVI Music Studio password',
            `Hi ${user.name},\n\n` +
                `Use the link below to set the password for your account (username: ${user.username}).\n\n` +
                `${link}\n\n` +
                `The link can be used once and expires in 24 hours.\n` +
                `If you did not expect this email, you can ignore it.\n\n` +
                `ELVI Music Studio`
        );

        if (!result.ok) {
            logger.error({ userId, error: result.error }, 'Password setup email failed');
            throw badRequest(`Could not send the email: ${result.error}`);
        }
        return { message: `A password setup link was sent to ${user.email}` };
    }

    /** Consumes a setup token and sets the password. Unauthenticated by design. */
    async completePasswordSetup(userId: string, rawToken: string, newPassword: string) {
        const user = await User.findById(userId).select('+resetTokenHash +resetTokenExpiresAt');
        if (!user?.resetTokenHash || !user.resetTokenExpiresAt) {
            throw badRequest('This link is no longer valid');
        }
        if (user.resetTokenExpiresAt.getTime() < Date.now()) {
            throw badRequest('This link has expired — ask an administrator for a new one');
        }

        const provided = Buffer.from(hashToken(rawToken));
        const stored = Buffer.from(user.resetTokenHash);
        // Constant-time compare so response timing cannot be used to guess the token.
        if (provided.length !== stored.length || !crypto.timingSafeEqual(provided, stored)) {
            throw badRequest('This link is no longer valid');
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        user.resetTokenHash = undefined;
        user.resetTokenExpiresAt = undefined;
        await user.save();

        return { message: 'Password set successfully. You can now sign in.' };
    }
}

export default new UserService();
