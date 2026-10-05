import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { dateRangeQuery } from '../validators/common';
import { getDashboard, getMonthly, getSummary } from '../controllers/statsController';

const router = Router();
const withRange = validate({ query: dateRangeQuery });

router.use(protect, adminOnly);
router.get('/summary', withRange, getSummary);
router.get('/monthly', withRange, getMonthly);
router.get('/dashboard', withRange, getDashboard);

export default router;
