import express, { Router } from 'express';
import * as cronController from '../controllers/cronController';
import { protect, adminOnly } from '../auth';

const router: Router = express.Router();

// Manual trigger for due date reminders
router.post('/trigger-reminders', protect as any, adminOnly as any, cronController.triggerReminders);

export default router;
