import User from '../models/User';
import { sendEmail } from '../utils/aws';
import { IUser } from '../interfaces/IUser';

class UserService {
    async getAllUsers(): Promise<IUser[]> {
        return await User.find().select('-password').sort({ createdAt: -1 });
    }

    async createUser(data: any): Promise<any> {
        const { name, username, password, role, email } = data;
        if (!name || !username || !password) {
            const error: any = new Error('name, username and password are required');
            error.statusCode = 400;
            throw error;
        }

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            const error: any = new Error('Username already taken');
            error.statusCode = 409;
            throw error;
        }

        const user = await User.create({ name, username, password, role, email });
        return {
            _id: user._id, name: user.name, username: user.username, email: user.email,
            role: user.role, isActive: user.isActive, createdAt: user.createdAt
        };
    }

    async updateUser(id: string, updateData: any): Promise<any> {
        const { name, role, password, email } = updateData;
        const user = await User.findById(id);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (email) user.email = email;
        if (password) user.password = password;

        await user.save();
        return {
            _id: user._id, name: user.name, username: user.username, email: user.email,
            role: user.role, isActive: user.isActive, lastLogin: user.lastLogin
        };
    }

    async toggleActive(id: string): Promise<{ isActive: boolean }> {
        const user = await User.findById(id);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        user.isActive = !user.isActive;
        await user.save();
        return { isActive: user.isActive };
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        return { message: 'User deleted' };
    }

    async shareCredentials(userId: string, password: string): Promise<{ message: string }> {
        const user = await User.findById(userId);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        if (!user.email) {
            const error: any = new Error('User does not have an email address');
            error.statusCode = 400;
            throw error;
        }

        const subject = 'Your Music Studio Management System Credentials';
        const text = `Hi ${user.name},\n\nYour account has been created/updated. Here are your credentials:\n\nUsername: ${user.username}\nPassword: ${password}\n\nPlease log in and change your password if needed.\n\nRegards,\nManagement`;
        await (sendEmail as any)(user.email, subject, text);
        return { message: 'Credentials shared successfully via email' };
    }
}

export default new UserService();
