import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, adminOnly } from '../middleware/auth';
import { triggerReminders } from '../controllers/cronController';

const router: Router = express.Router();

// Each run can dispatch SMS and email, which cost money — so the manual
// trigger is capped well below the general API budget.
const triggerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 6,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'The reminder job can only be triggered a few times per hour.' },
});

router.post('/trigger-reminders', protect, adminOnly, triggerLimiter, triggerReminders);

export default router;
