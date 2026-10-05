import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { triggerReminders } from '../controllers/cronController';

const router = Router();

router.post('/trigger-reminders', protect, adminOnly, triggerReminders);

export default router;
