import { Response } from 'express';
import { runDueDateReminders, runStatusSweep } from '../utils/cronJobs';
import { asyncHandler } from '../utils/asyncHandler';

// POST /api/cron/trigger-reminders
export const triggerReminders = asyncHandler(async (_req, res: Response) => {
    // Safe to call repeatedly: the job records which reminders each rental has
    // already received, so a manual run cannot double-send.
    const sweep = await runStatusSweep();
    const reminders = await runDueDateReminders();
    res.json({
        success: true,
        message: 'Reminder job completed',
        ...reminders,
        statusSweep: sweep,
    });
});
