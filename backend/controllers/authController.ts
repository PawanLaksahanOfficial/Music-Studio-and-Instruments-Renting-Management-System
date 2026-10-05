import { RequestHandler } from 'express';
import authService from '../services/authService';
import { clearSessionCookie, SESSION_COOKIE, setSessionCookie, verifySessionToken } from '../services/tokenService';
import { DEMO_READ_ONLY_MESSAGE } from '../middleware/auth';
import { forbidden } from '../utils/AppError';

// POST /api/auth/login
export const login: RequestHandler = async (req, res) => {
    const { user, token } = await authService.login(req.body.username, req.body.password, req.ip);
    setSessionCookie(res, token);
    res.json({ user });
};

// GET /api/auth/me
export const getMe: RequestHandler = async (req, res) => {
    res.json(await authService.getMe(req.user!.id));
};

// POST /api/auth/logout — always clears the cookie; revokes the session if it is still valid.
export const logout: RequestHandler = async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string') {
        try {
            const claims = verifySessionToken(token);
            // The shared demo account is used by many visitors at once; one signing out
            // must not end everyone else's session.
            if (claims.role !== 'Demo') await authService.logout(claims.sub);
        } catch {
            // Expired or invalid token: nothing to revoke.
        }
    }
    clearSessionCookie(res);
    res.status(204).end();
};

// PATCH /api/auth/password
export const changePassword: RequestHandler = async (req, res) => {
    if (req.user!.role === 'Demo') throw forbidden(DEMO_READ_ONLY_MESSAGE, 'DEMO_READ_ONLY');
    const { user, token } = await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    setSessionCookie(res, token);
    res.json({ user });
};
