import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { getSummary, getMonthly } from '../controllers/statsControler';

const router: Router = express.Router();

router.use(protect as any, adminOnly as any);
router.get('/summary', getSummary);
router.get('/monthly', getMonthly);

export default router;
