import { format, formatDistanceToNowStrict } from 'date-fns';

const numberFormat = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 });

export const formatCurrency = (amount?: number | null) => `Rs. ${numberFormat.format(amount ?? 0)}`;
export const formatNumber = (value?: number | null) => numberFormat.format(value ?? 0);

/*
 * Calendar dates (rental, due and return dates) are stored as UTC midnight of the day, e.g.
 * "2026-10-05T00:00:00.000Z". They are formatted from their YYYY-MM-DD part so the day never
 * shifts with the viewer's timezone. Real timestamps (createdAt, studio times) use local time.
 */
const calendarToLocal = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const formatCalendarDate = (iso?: string | null) => (iso ? format(calendarToLocal(iso), 'dd MMM yyyy') : '—');
export const formatDate = (iso?: string | null) => (iso ? format(new Date(iso), 'dd MMM yyyy') : '—');
export const formatDateTime = (iso?: string | null) => (iso ? format(new Date(iso), 'dd MMM yyyy, HH:mm') : '—');
export const formatTime = (iso?: string | null) => (iso ? format(new Date(iso), 'HH:mm') : '—');
export const formatRelative = (iso?: string | null) => (iso ? formatDistanceToNowStrict(new Date(iso), { addSuffix: true }) : '—');

/** Today's date as an <input type="date"> value ("YYYY-MM-DD"). */
export const todayInput = () => format(new Date(), 'yyyy-MM-dd');

export const addDaysInput = (value: string, days: number) => {
    const [y, m, d] = value.split('-').map(Number);
    return format(new Date(y, m - 1, d + days), 'yyyy-MM-dd');
};

/** Calendar-date ISO string to an <input type="date"> value. */
export const calendarToInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

/** Whole days between two "YYYY-MM-DD" values (negative if `to` is earlier). */
export const daysBetweenInputs = (from: string, to: string) => {
    if (!from || !to) return 0;
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
};

/** Timestamp to an <input type="datetime-local"> value, in the viewer's local time. */
export const toDateTimeInput = (iso?: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '');

/** <input type="datetime-local"> value (local time) to an ISO timestamp for the API. */
export const dateTimeInputToISO = (value: string) => new Date(value).toISOString();

/** Human label for a rental due date relative to today, e.g. "Due in 2 days" or "3 days overdue". */
export const dueLabel = (dueIso: string) => {
    const diff = daysBetweenInputs(todayInput(), dueIso.slice(0, 10));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff > 1) return `Due in ${diff} days`;
    return diff === -1 ? '1 day overdue' : `${-diff} days overdue`;
};
