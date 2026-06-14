import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { IUser } from '../interfaces/IUser';

class AuthService {
    signToken(user: IUser): string {
        const secret = process.env.JWT_SECRET as string;
        const options: SignOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN as any) || '8h'
        };
        
        return jwt.sign(
            { id: user._id, role: user.role },
            secret,
            options
        );
    }

    async login(username: string, password: string): Promise<any> {
        if (!username || !password) {
            const error: any = new Error('Username and password are required');
            error.statusCode = 400;
            throw error;
        }

        const user = await User.findOne({ username });
        if (!user) {
            const error: any = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        if (!user.isActive) {
            const error: any = new Error('Account is deactivated. Contact admin.');
            error.statusCode = 403;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error: any = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        user.lastLogin = new Date();
        await user.save();

        const token = this.signToken(user);
        return {
            token,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
            },
        };
    }

    async getMe(user: any): Promise<any> {
        return {
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
        };
    }
}

export default new AuthService();
