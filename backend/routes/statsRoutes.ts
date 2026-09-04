import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { statsQuery } from '../validation/schemas';
import { getSummary, getMonthly, getDashboard } from '../controllers/statsController';

const router: Router = express.Router();

router.use(protect, adminOnly);

router.get('/summary', validate({ query: statsQuery }), getSummary);
router.get('/monthly', validate({ query: statsQuery }), getMonthly);
router.get('/dashboard', validate({ query: statsQuery }), getDashboard);

export default router;
