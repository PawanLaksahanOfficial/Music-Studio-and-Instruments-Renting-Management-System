import cron from 'node-cron';
import ProductRental from '../models/ProductRental';
import { ICustomer } from '../interfaces/ICustomer';
import { notifications } from '../services/notifications';
import rentalService from '../services/rentalService';
import studioRentalService from '../services/studioRentalService';
import { logger } from './logger';
import { env } from '../config/env';
import { startOfDay } from './pricing';

type ReminderKind = 'due-tomorrow' | 'due-today' | 'overdue';

export interface ReminderRunResult {
    scanned: number;
    sent: number;
    skipped: number;
    failed: number;
}

const messageFor = (kind: ReminderKind, rentalId: string, dueDate: Date): string => {
    const date = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    switch (kind) {
        case 'due-tomorrow':
            return `Reminder: rental ${rentalId} is due tomorrow (${date}). Please return it to ELVI Studio.`;
        case 'due-today':
            return `Reminder: rental ${rentalId} is due today (${date}). Please return it to ELVI Studio.`;
        case 'overdue':
            return `URGENT: rental ${rentalId} was due on ${date} and is now overdue. Please return it to avoid further charges.`;
    }
};

const classify = (dueDate: Date, today: Date): ReminderKind | null => {
    const diffDays = Math.round((startOfDay(dueDate).getTime() - today.getTime()) / 86_400_000);
    if (diffDays === 1) return 'due-tomorrow';
    if (diffDays === 0) return 'due-today';
    if (diffDays < 0) return 'overdue';
    return null;
};

/**
 * Sends due-date reminders.
 *
 * Each rental records which reminder kinds it has already received, so a
 * restart, a second API instance, or a manual trigger cannot send the same
 * reminder twice. The marker is written before dispatch — a customer missing
 * one reminder is far better than being messaged repeatedly.
 */
export const runDueDateReminders = async (): Promise<ReminderRunResult> => {
    const today = startOfDay(new Date());
    const horizon = new Date(today.getTime() + 2 * 86_400_000);

    const rentals = await ProductRental.find({
        status: { $in: ['Rented', 'Overdue'] },
        isDeleted: false,
        isArchived: false,
        dueDate: { $lte: horizon },
    }).populate<{ customer: ICustomer }>('customer');

    const result: ReminderRunResult = { scanned: rentals.length, sent: 0, skipped: 0, failed: 0 };

    // Sequential per rental, but both channels for one rental go out together.
    for (const rental of rentals) {
        const kind = classify(rental.dueDate, today);
        const customer = rental.customer;

        if (!kind || !customer || rental.remindersSent.includes(kind)) {
            result.skipped++;
            continue;
        }

        // Claim the reminder atomically: if another instance already added this
        // kind, modifiedCount is 0 and we skip rather than double-send.
        const claim = await ProductRental.updateOne(
            { _id: rental._id, remindersSent: { $ne: kind } },
            { $addToSet: { remindersSent: kind }, $set: { lastReminderSentAt: new Date() } }
        );
        if (claim.modifiedCount === 0) {
            result.skipped++;
            continue;
        }

        const message = messageFor(kind, rental.rentalId, rental.dueDate);
        const outcomes = await Promise.all([
            customer.phone ? notifications.sendSms(customer.phone, message) : null,
            customer.email
                ? notifications.sendEmail(customer.email, 'Rental due date reminder — ELVI Studio', message)
                : null,
        ]);

        const attempted = outcomes.filter(Boolean);
        if (attempted.length && attempted.every(o => o!.ok === false)) {
            result.failed++;
            // Release the claim so the next run can retry a total failure.
            await ProductRental.updateOne({ _id: rental._id }, { $pull: { remindersSent: kind } });
            logger.warn({ rentalId: rental.rentalId, kind }, 'All reminder channels failed — will retry next run');
        } else {
            result.sent++;
        }
    }

    logger.info(result, 'Due date reminder run complete');
    return result;
};

/** Keeps rental and booking statuses current. */
export const runStatusSweep = async () => {
    const [overdue, completed] = await Promise.all([
        rentalService.markOverdueRentals(),
        studioRentalService.completePastBookings(),
    ]);
    logger.info({ overdue, completed }, 'Status sweep complete');
    return { overdue, completed };
};

/**
 * In-process scheduling is fine for a single instance. Set ENABLE_CRON=false
 * and drive these from an external scheduler (an Azure Function timer trigger)
 * when running more than one instance, or every instance fires the job.
 */
export const initCronJobs = () => {
    if (!env.ENABLE_CRON) {
        logger.info('ENABLE_CRON is false — in-process jobs are disabled');
        return;
    }

    cron.schedule(env.REMINDER_CRON, async () => {
        try {
            await runStatusSweep();
            await runDueDateReminders();
        } catch (err) {
            logger.error({ err }, 'Scheduled reminder job failed');
        }
    });

    logger.info({ schedule: env.REMINDER_CRON }, 'Cron jobs initialised');
};
