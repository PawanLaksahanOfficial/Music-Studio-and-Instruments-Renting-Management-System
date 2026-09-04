import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { IUser } from '../interfaces/IUser';
import { env } from '../config/env';
import { unauthorized, forbidden } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export interface AuthRequest extends Request {
    user?: IUser;
}

interface TokenPayload {
    id: string;
    role: string;
    iat: number;
    exp: number;
}

export const protect = asyncHandler<AuthRequest>(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw unauthorized('No token provided');
    }

    let decoded: TokenPayload;
    try {
        decoded = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as TokenPayload;
    } catch {
        throw unauthorized('Invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
        throw unauthorized('User not found or inactive');
    }

    // A password change invalidates every token issued before it, so a
    // compromised session cannot outlive the credential it was created with.
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
        throw unauthorized('Password was changed — please sign in again');
    }

    req.user = user;
    next();
});

export const adminOnly = (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user?.role !== 'Admin') {
        return next(forbidden('Admin access required'));
    }
    next();
};

/** The authenticated user, for handlers that run behind `protect`. */
export const requireUser = (req: AuthRequest): IUser => {
    if (!req.user) throw unauthorized('Not authenticated');
    return req.user;
};
