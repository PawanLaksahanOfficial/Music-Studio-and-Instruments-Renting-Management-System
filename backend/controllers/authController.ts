import { Request, Response } from 'express';
import authService from '../services/authService';

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await authService.getMe((req as any).user);
        res.json(user);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};
