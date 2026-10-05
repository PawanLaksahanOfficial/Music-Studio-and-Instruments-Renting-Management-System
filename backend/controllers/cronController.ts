import { RequestHandler } from 'express';
import { markOverdueRentals, runDueDateReminders } from '../utils/cronJobs';
import { logger } from '../utils/logger';

// POST /api/cron/trigger-reminders
export const triggerReminders: RequestHandler = async (req, res) => {
    logger.info({ event: 'cron.manual_trigger', by: req.user!.id }, 'Reminders triggered manually');
    const overdueMarked = await markOverdueRentals();
    const summary = await runDueDateReminders();
    res.json({
        message: `Reminders processed: ${summary.sent} sent, ${summary.skipped} already sent or not due, ${summary.failed} failed.`,
        overdueMarked,
        ...summary,
    });
};
