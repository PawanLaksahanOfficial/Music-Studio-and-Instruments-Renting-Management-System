import { RequestHandler } from 'express';
import statsService from '../services/statsService';
import { getQuery } from '../middleware/validate';
import { dateRangeQuery } from '../validators/common';

// GET /api/stats/summary
export const getSummary: RequestHandler = async (_req, res) => {
    res.json(await statsService.getSummary(getQuery(res, dateRangeQuery)));
};

// GET /api/stats/monthly
export const getMonthly: RequestHandler = async (_req, res) => {
    res.json(await statsService.getMonthly(getQuery(res, dateRangeQuery)));
};

// GET /api/stats/dashboard
export const getDashboard: RequestHandler = async (_req, res) => {
    res.json(await statsService.getDashboard(getQuery(res, dateRangeQuery)));
};
