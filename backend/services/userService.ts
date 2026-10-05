import { randomBytes, randomInt } from 'node:crypto';
import { z } from 'zod';
import User from '../models/User';
import Invoice from '../models/Invoice';
import { AppError, badRequest, conflict, forbidden, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { isEmailConfigured, sendEmail } from '../utils/aws';
import { createUserBody, updateUserBody } from '../validators/user';
import { AuthUser } from '../interfaces/IUser';
import { toPublicUser } from './authService';

type CreateUserInput = z.infer<typeof createUserBody>;
type UpdateUserInput = z.infer<typeof updateUserBody>;

/** A random temporary password that satisfies the password policy (letters and digits). */
const generateTemporaryPassword = () => `${randomBytes(9).toString('base64url').replace(/[-_]/g, 'x')}${randomInt(10)}k`;

class UserService {
    async list() {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        return users.map(toPublicUser);
    }

    async create(input: CreateUserInput, actor: AuthUser) {
        if (await User.exists({ username: input.username })) throw conflict('That username is already taken');

        // Admin-chosen passwords are temporary: the user picks their own on first sign-in.
        const user = await User.create({ ...input, email: input.email || undefined, mustChangePassword: true });
        logger.info({ event: 'user.created', userId: user.id, role: user.role, by: actor.id }, 'User created');
        return toPublicUser(user);
    }

    async update(id: string, input: UpdateUserInput, actor: AuthUser) {
        const user = await User.findById(id);
        if (!user) throw notFound('User');

        const isSelf = user.id === actor.id;
        if (input.role && input.role !== user.role) {
            if (isSelf) throw forbidden('You cannot change your own role');
            if (user.role === 'Admin') await this.assertAnotherActiveAdmin(user.id);
            user.role = input.role;
            user.tokenVersion += 1; // new permissions take effect immediately
        }
        if (input.name) user.name = input.name;
        if (input.email !== undefined) user.email = input.email || undefined;
        if (input.password) {
            // Own password changes go through /auth/password, which requires the current password.
            if (isSelf) throw forbidden('Use "Change password" to change your own password');
            user.password = input.password;
            user.mustChangePassword = true;
            user.tokenVersion += 1;
        }

        await user.save();
        logger.info({ event: 'user.updated', userId: user.id, by: actor.id, fields: Object.keys(input) }, 'User updated');
        return toPublicUser(user);
    }

    async toggleActive(id: string, actor: AuthUser) {
        if (id === actor.id) throw forbidden('You cannot deactivate your own account');
        const user = await User.findById(id);
        if (!user) throw notFound('User');

        if (user.isActive && user.role === 'Admin') await this.assertAnotherActiveAdmin(user.id);
        user.isActive = !user.isActive;
        if (!user.isActive) user.tokenVersion += 1; // sign the user out everywhere
        await user.save();

        logger.info({ event: user.isActive ? 'user.activated' : 'user.deactivated', userId: user.id, by: actor.id }, 'User status changed');
        return { isActive: user.isActive };
    }

    async remove(id: string, actor: AuthUser) {
        if (id === actor.id) throw forbidden('You cannot delete your own account');
        const user = await User.findById(id);
        if (!user) throw notFound('User');

        if (user.role === 'Admin' && user.isActive) await this.assertAnotherActiveAdmin(user.id);
        if (await Invoice.exists({ createdBy: user._id })) {
            throw conflict('This user has issued invoices, so it is kept for the audit trail. Deactivate the account instead.');
        }

        await user.deleteOne();
        logger.info({ event: 'user.deleted', userId: id, by: actor.id }, 'User deleted');
        return { message: 'User deleted' };
    }

    /**
     * Issues a new temporary password and emails it with the username. The admin never sees it,
     * and the user must replace it on first sign-in. Existing sessions are revoked.
     */
    async sendLoginDetails(id: string, actor: AuthUser) {
        const user = await User.findById(id);
        if (!user) throw notFound('User');
        if (!user.email) throw badRequest('Add an email address to this user first');
        if (!user.isActive) throw badRequest('Activate this user before sending login details');
        // Check before resetting the password, so a misconfiguration can't lock the user out.
        if (!isEmailConfigured()) throw new AppError(503, 'Email sending is not configured on the server', 'EMAIL_NOT_CONFIGURED');

        const temporaryPassword = generateTemporaryPassword();
        user.password = temporaryPassword;
        user.mustChangePassword = true;
        user.tokenVersion += 1;
        await user.save();

        const text = [
            `Hi ${user.name},`,
            '',
            'An account has been set up for you on the ELVI Music Studio management system.',
            '',
            `Username: ${user.username}`,
            `Temporary password: ${temporaryPassword}`,
            '',
            'You will be asked to choose your own password when you sign in.',
            'If you did not expect this email, please contact your administrator.',
        ].join('\n');

        try {
            await sendEmail(user.email, 'Your ELVI Music Studio sign-in details', text);
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError(502, 'The email could not be sent. Please try again later.', 'EMAIL_FAILED');
        }

        logger.info({ event: 'user.login_details_sent', userId: user.id, by: actor.id }, 'Login details emailed');
        return { message: `Sign-in details sent to ${user.email}` };
    }

    private async assertAnotherActiveAdmin(excludingUserId: string) {
        const otherAdmins = await User.countDocuments({ role: 'Admin', isActive: true, _id: { $ne: excludingUserId } });
        if (otherAdmins === 0) throw conflict('At least one active administrator is required');
    }
}

export default new UserService();
