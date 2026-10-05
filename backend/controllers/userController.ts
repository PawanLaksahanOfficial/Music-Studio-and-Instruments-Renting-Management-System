import { RequestHandler } from 'express';
import userService from '../services/userService';

// GET /api/users
export const listUsers: RequestHandler = async (_req, res) => {
    res.json(await userService.list());
};

// POST /api/users
export const createUser: RequestHandler = async (req, res) => {
    res.status(201).json(await userService.create(req.body, req.user!));
};

// PATCH /api/users/:id
export const updateUser: RequestHandler = async (req, res) => {
    res.json(await userService.update(req.params.id as string, req.body, req.user!));
};

// PATCH /api/users/:id/toggle-active
export const toggleActive: RequestHandler = async (req, res) => {
    res.json(await userService.toggleActive(req.params.id as string, req.user!));
};

// DELETE /api/users/:id
export const deleteUser: RequestHandler = async (req, res) => {
    res.json(await userService.remove(req.params.id as string, req.user!));
};

// POST /api/users/:id/send-login-details
export const sendLoginDetails: RequestHandler = async (req, res) => {
    res.json(await userService.sendLoginDetails(req.params.id as string, req.user!));
};
