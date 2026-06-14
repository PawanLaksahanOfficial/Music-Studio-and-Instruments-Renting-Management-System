import { Request, Response } from 'express';
import userService from '../services/userService';

// GET /api/users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/users (Admin only)
export const createUser = async (req: Request, res: Response) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/users/:id (Admin only)
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userService.updateUser(id as string, req.body);
        res.json(user);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/users/:id/toggle-active (Admin only)
export const toggleActive = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await userService.toggleActive(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// DELETE /api/users/:id (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await userService.deleteUser(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// POST /api/users/share-credentials
export const shareCredentials = async (req: Request, res: Response) => {
    try {
        const { userId, password } = req.body;
        const result = await userService.shareCredentials(userId as string, password as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};
