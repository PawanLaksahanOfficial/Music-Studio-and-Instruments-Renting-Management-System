import { Request, Response } from 'express';
const { runDueDateReminders } = require('../utils/cronJobs');

export const triggerReminders = async (req: Request, res: Response) => {
    try {
        const count = await runDueDateReminders();
        res.status(200).json({
            success: true,
            message: 'Due date reminders triggered successfully',
            processedCount: count
        });
    } catch (error: any) {
        console.error('Manual trigger error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger reminders',
            error: error.message
        });
    }
};
