import { Request, Response } from 'express';
import statsService from '../services/statsService';

// GET /api/stats/summary
export const getSummary = async (req: Request, res: Response) => {
    try {
        const summary = await statsService.getSummary(req.query);
        res.json(summary);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/stats/monthly
export const getMonthly = async (req: Request, res: Response) => {
    try {
        const monthly = await statsService.getMonthly(req.query);
        res.json(monthly);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/stats/dashboard
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const dashboard = await statsService.getDashboard(req.query);
        res.json(dashboard);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
