import { z } from 'zod';
import { PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES, SIMPLE_PAYMENT_STATUSES } from '../config/constants';
import { dateOnly, money, objectId, optionalText } from './common';

export const createRentalBody = z
    .object({
        customerId: objectId,
        itemIds: z.array(objectId).min(1, 'Select at least one item').max(20, 'At most 20 items per rental'),
        rentalDate: dateOnly.optional(),
        dueDate: dateOnly,
        paymentStatus: z.enum(RENTAL_PAYMENT_STATUSES).default('Pending'),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        notes: optionalText(1000),
        /** When present, an invoice for this rental is created in the same transaction. */
        invoice: z
            .object({
                paymentMethod: z.enum(PAYMENT_METHODS),
                paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES).default('Pending'),
                tax: money.default(0),
                notes: optionalText(1000),
            })
            .optional(),
    })
    .refine(b => new Set(b.itemIds).size === b.itemIds.length, { message: 'Each item can only be added once', path: ['itemIds'] })
    .refine(b => !b.rentalDate || b.rentalDate <= b.dueDate, { message: 'Due date must be on or after the rental date', path: ['dueDate'] });

export const updateRentalBody = z.object({
    paymentStatus: z.enum(RENTAL_PAYMENT_STATUSES).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    notes: optionalText(1000),
});

export const extendRentalBody = z.object({
    newDueDate: dateOnly,
});

export const returnQuoteQuery = z.object({
    returnDate: dateOnly,
});

export const returnRentalBody = z.object({
    returnDate: dateOnly,
    damageCharges: money.default(0),
    damageNotes: optionalText(1000),
    damagedItemIds: z.array(objectId).max(20).default([]),
    paymentStatus: z.enum(RENTAL_PAYMENT_STATUSES),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    /** Admin-only manual override of the computed late fee (e.g. a waiver). */
    lateFeeOverride: money.optional(),
});

export const qrCodeParams = z.object({
    qrCodeId: z.string().trim().min(1).max(300),
});
