import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParams = z.object({ id: objectId });

/** Calendar date in "YYYY-MM-DD" form. */
export const dateOnly = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format')
    .refine(v => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Invalid date');

/** ISO-8601 timestamp with timezone (what `Date.prototype.toISOString()` produces). */
export const isoDateTime = z.iso.datetime({ offset: true });

export const money = z.number().finite().min(0, 'Amount cannot be negative').max(100_000_000, 'Amount is too large');

export const requiredText = (max: number) => z.string().trim().min(1, 'Required').max(max, `Must be at most ${max} characters`);

/** Optional free text; empty strings are kept so a field can be cleared. */
export const optionalText = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const optionalEmail = z
    .union([z.literal(''), z.email('Invalid email address').max(254)])
    .optional()
    .transform(v => (v ? v.toLowerCase() : v));

export const phone = z
    .string()
    .trim()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[\d\s()-]+$/, 'Phone number may only contain digits, spaces, +, - and ()');

export const password = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number');

export const dateRangeQuery = z
    .object({ start: dateOnly.optional(), end: dateOnly.optional() })
    .refine(r => !r.start || !r.end || r.start <= r.end, { message: 'Start date must be before end date', path: ['end'] });
