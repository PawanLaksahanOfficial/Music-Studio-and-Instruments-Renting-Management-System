import cron, { ScheduledTask } from 'node-cron';
import ProductRental from '../models/ProductRental';
import { env } from '../config/env';
import { ACTIVE_RENTAL_STATUSES } from '../config/constants';
import { logger } from './logger';
import { addDays, toDateOnly, today } from './dates';
import { sendEmail, sendSMS } from './aws';

const BUSINESS_NAME = 'ELVI Music Studio';
const SEND_CONCURRENCY = 5;

/** Marks rentals whose due date has passed as Overdue. Safe to run repeatedly. */
export const markOverdueRentals = async (now: Date = new Date()): Promise<number> => {
    const result = await ProductRental.updateMany(
        { status: 'Rented', isDeleted: false, dueDate: { $lt: today(now) } },
        { $set: { status: 'Overdue' } },
    );
    if (result.modifiedCount > 0) {
        logger.info({ event: 'cron.overdue_marked', count: result.modifiedCount }, 'Rentals marked overdue');
    }
    return result.modifiedCount;
};

type ReminderKind = 'due_tomorrow' | 'due_today' | 'overdue';

const reminderMessage = (kind: ReminderKind, rentalId: string, dueDate: string) => {
    switch (kind) {
        case 'due_tomorrow': return `Reminder: your rental ${rentalId} from ${BUSINESS_NAME} is due back tomorrow (${dueDate}).`;
        case 'due_today': return `Reminder: your rental ${rentalId} from ${BUSINESS_NAME} is due back today.`;
        case 'overdue': return `Your rental ${rentalId} from ${BUSINESS_NAME} was due on ${dueDate}. Please return it as soon as possible to avoid further late fees.`;
    }
};

/** Runs `tasks` with at most `limit` in flight. */
const runWithConcurrency = async (tasks: (() => Promise<void>)[], limit: number) => {
    let next = 0;
    const worker = async () => {
        while (next < tasks.length) await tasks[next++]();
    };
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
};

export interface ReminderSummary {
    candidates: number;
    sent: number;
    failed: number;
    skipped: number;
}

/**
 * Sends due-tomorrow, due-today and one-day-overdue reminders by SMS and email. Each reminder is
 * recorded on the rental, so re-running (manually or on several servers) never sends duplicates.
 */
export const runDueDateReminders = async (now: Date = new Date()): Promise<ReminderSummary> => {
    const day = today(now);
    const kindByDate = new Map<string, ReminderKind>([
        [toDateOnly(addDays(day, 1)), 'due_tomorrow'],
        [toDateOnly(day), 'due_today'],
        [toDateOnly(addDays(day, -1)), 'overdue'],
    ]);

    const rentals = await ProductRental.find({
        status: { $in: ACTIVE_RENTAL_STATUSES },
        isDeleted: false,
        dueDate: { $gte: addDays(day, -1), $lt: addDays(day, 2) },
    })
        .populate<{ customer: { phone?: string; email?: string } | null }>('customer', 'phone email')
        .select('rentalId dueDate remindersSent customer')
        .lean();

    const summary: ReminderSummary = { candidates: rentals.length, sent: 0, failed: 0, skipped: 0 };

    const tasks = rentals.map(rental => async () => {
        const due = toDateOnly(rental.dueDate);
        const kind = kindByDate.get(due);
        const key = `${kind}:${due}`;
        if (!kind || !rental.customer || rental.remindersSent?.includes(key)) {
            summary.skipped += 1;
            return;
        }

        const message = reminderMessage(kind, rental.rentalId, due);
        const sends: Promise<unknown>[] = [];
        if (rental.customer.phone) sends.push(sendSMS(rental.customer.phone, message));
        if (rental.customer.email) sends.push(sendEmail(rental.customer.email, `Rental reminder — ${BUSINESS_NAME}`, message));

        const results = await Promise.allSettled(sends);
        if (results.some(r => r.status === 'fulfilled')) {
            await ProductRental.updateOne({ _id: rental._id }, { $addToSet: { remindersSent: key } });
            summary.sent += 1;
        } else {
            summary.failed += 1;
        }
    });

    await runWithConcurrency(tasks, SEND_CONCURRENCY);
    logger.info({ event: 'cron.reminders_completed', ...summary }, 'Due date reminders completed');
    return summary;
};

const safely = (name: string, job: () => Promise<unknown>) => async () => {
    try {
        await job();
    } catch (err) {
        logger.error({ err, job: name }, 'Scheduled job failed');
    }
};

/** Schedules background jobs in the business timezone. Returns a function that stops them. */
export const initCronJobs = (): (() => void) => {
    const options = { timezone: env.APP_TIMEZONE, noOverlap: true };
    const tasks: ScheduledTask[] = [
        cron.schedule('5 * * * *', safely('mark-overdue', () => markOverdueRentals()), { ...options, name: 'mark-overdue' }),
        cron.schedule('0 9 * * *', safely('due-reminders', () => runDueDateReminders()), { ...options, name: 'due-reminders' }),
    ];
    void safely('mark-overdue', () => markOverdueRentals())();
    logger.info({ timezone: env.APP_TIMEZONE }, 'Cron jobs scheduled');
    return () => tasks.forEach(t => t.stop());
};
