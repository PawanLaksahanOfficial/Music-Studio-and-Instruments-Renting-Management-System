import { Response } from 'express';
import authService from '../services/authService';
import userService from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest, requireUser } from '../middleware/auth';

// POST /api/auth/login
export const login = asyncHandler(async (req, res: Response) => {
    const { username, password } = req.body;
    res.json(await authService.login(username, password));
});

// GET /api/auth/me
export const getMe = asyncHandler<AuthRequest>(async (req, res) => {
    res.json(await authService.getMe(requireUser(req)));
});

// POST /api/auth/change-password
export const changePassword = asyncHandler<AuthRequest>(async (req, res) => {
    const user = requireUser(req);
    const { currentPassword, newPassword } = req.body;
    res.json(await authService.changePassword(String(user._id), currentPassword, newPassword));
});

// POST /api/auth/set-password — completes an emailed setup link (unauthenticated)
export const completePasswordSetup = asyncHandler(async (req, res: Response) => {
    const { userId, token, newPassword } = req.body;
    res.json(await userService.completePasswordSetup(userId, token, newPassword));
});
