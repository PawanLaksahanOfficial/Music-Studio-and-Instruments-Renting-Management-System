import { Response } from 'express';
import statsService from '../services/statsService';
import { asyncHandler } from '../utils/asyncHandler';

interface RangeQuery {
    start?: string;
    end?: string;
}

// GET /api/stats/summary
export const getSummary = asyncHandler(async (req, res: Response) => {
    res.json(await statsService.getSummary(req.query as RangeQuery));
});

// GET /api/stats/monthly
export const getMonthly = asyncHandler(async (req, res: Response) => {
    res.json(await statsService.getMonthly(req.query as RangeQuery));
});

// GET /api/stats/dashboard
export const getDashboard = asyncHandler(async (req, res: Response) => {
    res.json(await statsService.getDashboard(req.query as RangeQuery));
});
