import { z } from 'zod';
import mongoose from 'mongoose';

export const objectId = z
    .string()
    .refine(v => mongoose.Types.ObjectId.isValid(v), { message: 'Must be a valid id' });

export const idParam = z.object({ id: objectId });

/** Standard list query: page/limit plus a free-text search term. */
export const paginationQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(25),
    search: z.string().trim().max(200).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;

export const dateRangeQuery = z.object({
    start: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    end: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

/** An ISO date or datetime string, normalised to a Date. */
export const dateString = z
    .string()
    .min(1)
    .refine(v => !Number.isNaN(Date.parse(v)), { message: 'Must be a valid date' })
    .transform(v => new Date(v));

export const paymentStatus = z.enum(['Paid', 'Pending', 'Partial']);
export const paymentMethod = z.enum(['Cash', 'Card', 'Transfer']);
