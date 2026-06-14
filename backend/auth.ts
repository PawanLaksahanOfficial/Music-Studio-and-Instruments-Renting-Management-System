import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from './models/User';
import { IUser } from './interfaces/IUser';

// Custom interface for request with user
export interface AuthRequest extends Request {
    user?: IUser;
}

// Verify JWT and attach user to req
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
