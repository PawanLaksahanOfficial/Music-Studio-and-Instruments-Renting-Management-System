import { env } from '../config/env';

/*
 * Calendar dates (rental date, due date, return date) are stored as UTC midnight of the
 * calendar day, e.g. "2026-10-05" -> 2026-10-05T00:00:00.000Z. "Today" is resolved in the
 * business timezone (APP_TIMEZONE) so day counts don't depend on the server's clock zone.
 */

const DAY_MS = 86_400_000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses "YYYY-MM-DD" into a UTC-midnight Date. Throws on malformed input. */
export const parseDateOnly = (value: string): Date => {
    const match = DATE_ONLY.exec(value);
    if (!match) throw new Error(`Invalid date: ${value}`);
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
    return date;
};

/** Formats a stored calendar date (UTC midnight) back to "YYYY-MM-DD". */
export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

/** Today's calendar date in the business timezone, as "YYYY-MM-DD". */
export const todayDateOnly = (timeZone: string = env.APP_TIMEZONE, now: Date = new Date()): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** Today in the business timezone as a UTC-midnight Date (comparable with stored calendar dates). */
export const today = (now: Date = new Date()): Date => parseDateOnly(todayDateOnly(env.APP_TIMEZONE, now));

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

/** Whole days from `from` to `to` (both calendar dates). Negative if `to` is earlier. */
export const daysBetween = (from: Date, to: Date): number => Math.round((startOfUtcDay(to) - startOfUtcDay(from)) / DAY_MS);

/** Billable days for a rental: at least one day. */
export const rentalDays = (start: Date, due: Date): number => Math.max(1, daysBetween(start, due));

/** Days a return is late: zero when returned on or before the due date. */
export const lateDays = (due: Date, returned: Date): number => Math.max(0, daysBetween(due, returned));

const startOfUtcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** Offset of `timeZone` from UTC at `instant`, in minutes (e.g. +330 for Asia/Colombo). */
const timeZoneOffsetMinutes = (instant: Date, timeZone: string): number => {
    const label = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
        .formatToParts(instant)
        .find(p => p.type === 'timeZoneName')?.value ?? 'GMT';
    const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(label);
    if (!match) return 0;
    const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
    return match[1] === '-' ? -minutes : minutes;
};

/** The real instant at which calendar day "YYYY-MM-DD" starts in the business timezone. */
export const zonedStartOfDay = (value: string, timeZone: string = env.APP_TIMEZONE): Date => {
    const utcMidnight = parseDateOnly(value);
    return new Date(utcMidnight.getTime() - timeZoneOffsetMinutes(utcMidnight, timeZone) * 60_000);
};

/** The real instant at which calendar day "YYYY-MM-DD" ends (exclusive) in the business timezone. */
export const zonedEndOfDay = (value: string, timeZone: string = env.APP_TIMEZONE): Date =>
    zonedStartOfDay(toDateOnly(addDays(parseDateOnly(value), 1)), timeZone);
