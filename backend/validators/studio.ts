import { z } from 'zod';
import { MAX_STUDIO_BOOKING_HOURS, SIMPLE_PAYMENT_STATUSES, STUDIO_ROOMS, STUDIO_STATUSES } from '../config/constants';
import { isoDateTime, money, objectId, optionalText } from './common';

const MAX_MS = MAX_STUDIO_BOOKING_HOURS * 3_600_000;

const timesAreValid = (b: { startTime?: string; endTime?: string }) =>
    !b.startTime || !b.endTime || new Date(b.endTime) > new Date(b.startTime);

const durationIsValid = (b: { startTime?: string; endTime?: string }) =>
    !b.startTime || !b.endTime || new Date(b.endTime).getTime() - new Date(b.startTime).getTime() <= MAX_MS;

const bookingFields = z.object({
    customerId: objectId,
    roomName: z.enum(STUDIO_ROOMS),
    startTime: isoDateTime,
    endTime: isoDateTime,
    totalAmount: money,
    status: z.enum(STUDIO_STATUSES).default('Confirmed'),
    paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES).default('Pending'),
    notes: optionalText(1000),
});

const withTimeRules = <T extends z.ZodType<{ startTime?: string; endTime?: string }>>(schema: T) =>
    schema
        .refine(timesAreValid, { message: 'End time must be after the start time', path: ['endTime'] })
        .refine(durationIsValid, { message: `A booking can be at most ${MAX_STUDIO_BOOKING_HOURS} hours`, path: ['endTime'] });

export const createStudioBody = withTimeRules(bookingFields);

export const updateStudioBody = withTimeRules(
    bookingFields.extend({
        status: z.enum(STUDIO_STATUSES),
        paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES),
    }).partial(),
);
