import { Response } from 'express';
import userService from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest, requireUser } from '../middleware/auth';
import { env } from '../config/env';

// GET /api/users
export const getAllUsers = asyncHandler(async (_req, res: Response) => {
    res.json(await userService.getAllUsers());
});

// POST /api/users
export const createUser = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await userService.createUser(req.body));
});

// PATCH /api/users/:id
export const updateUser = asyncHandler(async (req, res: Response) => {
    res.json(await userService.updateUser(req.params.id, req.body));
});

// PATCH /api/users/:id/toggle-active
export const toggleActive = asyncHandler(async (req, res: Response) => {
    res.json(await userService.toggleActive(req.params.id));
});

// DELETE /api/users/:id
export const deleteUser = asyncHandler<AuthRequest>(async (req, res) => {
    res.json(await userService.deleteUser(req.params.id, String(requireUser(req)._id)));
});

// POST /api/users/send-setup-link
export const sendSetupLink = asyncHandler(async (req, res: Response) => {
    // The link points at the SPA, which posts back to /api/auth/set-password.
    const appBaseUrl = env.corsOrigins[0] ?? 'http://localhost:5173';
    res.json(await userService.sendPasswordSetupLink(req.body.userId, appBaseUrl));
});
