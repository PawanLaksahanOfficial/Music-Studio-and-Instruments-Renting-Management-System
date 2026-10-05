import { RequestHandler } from 'express';
import User from '../models/User';
import { Role } from '../config/constants';
import { forbidden, unauthorized } from '../utils/AppError';
import { SESSION_COOKIE, verifySessionToken } from '../services/tokenService';

const SESSION_EXPIRED = 'Your session has expired. Please sign in again.';

const readToken = (cookie: unknown, authorization?: string): string | undefined => {
    if (typeof cookie === 'string' && cookie) return cookie;
    // Bearer fallback for non-browser API clients.
    if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
    return undefined;
};

/** Verifies the session and attaches `req.user`. Rejects deactivated users and revoked tokens. */
export const authenticate: RequestHandler = async (req, _res, next) => {
    const token = readToken(req.cookies?.[SESSION_COOKIE], req.headers.authorization);
    if (!token) throw unauthorized();

    let claims;
    try {
        claims = verifySessionToken(token);
    } catch {
        throw unauthorized(SESSION_EXPIRED);
    }

    const user = await User.findById(claims.sub)
        .select('name username email role isActive tokenVersion mustChangePassword')
        .lean();

    if (!user || !user.isActive || (user.tokenVersion ?? 0) !== claims.tv) {
        throw unauthorized(SESSION_EXPIRED);
    }

    req.user = {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
    };
    next();
};

/** Blocks every endpoint except the auth ones until a user replaces an admin-issued password. */
const requireFreshPassword: RequestHandler = (req, _res, next) => {
    if (req.user?.mustChangePassword) {
        throw forbidden('You must change your password before continuing.', 'PASSWORD_CHANGE_REQUIRED');
    }
    next();
};

/** Standard guard for business routes. */
export const protect: RequestHandler[] = [authenticate, requireFreshPassword];

export const requireRole = (...roles: Role[]): RequestHandler => (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw forbidden('Administrator access required');
    next();
};

export const adminOnly = requireRole('Admin');
