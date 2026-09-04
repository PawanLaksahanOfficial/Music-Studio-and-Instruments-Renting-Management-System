import { z } from 'zod';
import { objectId, dateString, paginationQuery, dateRangeQuery, paymentMethod } from './common';

// ─── Auth ──────────────────────────────────────────────────────────────────

/**
 * Password policy applied wherever a password is set. Length does more for
 * strength than character-class rules, so the floor is 10 with a light
 * composition check rather than a maze of required symbols.
 */
export const passwordSchema = z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters')
    .refine(v => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
        message: 'Password must contain at least one letter and one number',
    });

export const loginSchema = z.object({
    username: z.string().trim().min(1, 'Username is required').max(64),
    password: z.string().min(1, 'Password is required').max(128),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
    })
    .refine(d => d.currentPassword !== d.newPassword, {
        message: 'New password must be different from the current one',
        path: ['newPassword'],
    });

export const completeSetupSchema = z.object({
    userId: objectId,
    token: z.string().min(32, 'Invalid token'),
    newPassword: passwordSchema,
});

// ─── Users ─────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
    name: z.string().trim().min(1).max(120),
    username: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, 'Username must be at least 3 characters')
        .max(64)
        .regex(/^[a-z0-9._-]+$/, 'Username may contain letters, numbers, dot, underscore and hyphen only'),
    password: passwordSchema,
    role: z.enum(['Admin', 'Cashier']).default('Cashier'),
    email: z.email('Must be a valid email').optional().or(z.literal('')),
});

export const updateUserSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    role: z.enum(['Admin', 'Cashier']).optional(),
    email: z.email('Must be a valid email').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
});

export const sendSetupLinkSchema = z.object({ userId: objectId });

// ─── Customers ─────────────────────────────────────────────────────────────

const phone = z
    .string()
    .trim()
    .min(7, 'Phone number is too short')
    .max(20)
    .regex(/^\+?[0-9\s-]+$/, 'Phone number may contain digits, spaces, hyphens and a leading +');

export const createCustomerSchema = z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email('Must be a valid email').optional().or(z.literal('')),
    phone,
    address: z.string().trim().max(300).optional(),
    nicOrPassport: z.string().trim().min(4).max(30),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Inventory ─────────────────────────────────────────────────────────────

export const inventoryCategory = z.enum(['Instruments', 'Audio Gear', 'Cables', 'Other']);
export const inventoryStatus = z.enum(['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost']);

export const createInventorySchema = z.object({
    itemName: z.string().trim().min(1).max(150),
    category: inventoryCategory,
    brand: z.string().trim().max(80).optional(),
    itemModel: z.string().trim().max(80).optional(),
    serialNumber: z.string().trim().min(1).max(80),
    status: inventoryStatus.default('Available'),
    baseRentalPrice: z.coerce.number().min(0, 'Price cannot be negative').max(10_000_000),
    purchaseDate: dateString.optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const updateInventorySchema = createInventorySchema.partial().extend({
    lastMaintenance: dateString.optional(),
});

export const inventoryListQuery = paginationQuery.extend({
    status: z.string().optional(),
    category: z.string().optional(),
});

// ─── Rooms ─────────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
    name: z.string().trim().min(1).max(80),
    hourlyRate: z.coerce.number().min(0).max(10_000_000),
    capacity: z.coerce.number().int().min(1).max(500).optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().default(true),
});

export const updateRoomSchema = createRoomSchema.partial();

// ─── Product rentals ───────────────────────────────────────────────────────

const rentalItem = z.object({
    itemId: objectId,
    quantity: z.coerce.number().int().min(1).max(100).default(1),
});

/**
 * Note what is absent: no `totalAmount`. Pricing is computed server-side from
 * stored rates, so the client cannot name its own price.
 */
export const createRentalSchema = z.object({
    customerId: objectId,
    items: z.array(rentalItem).min(1, 'At least one item is required').max(50),
    rentalDate: dateString.optional(),
    dueDate: dateString,
    paymentStatus: z.enum(['Paid', 'Pending', 'Partial']).default('Pending'),
    notes: z.string().trim().max(1000).optional(),
});

export const quoteRentalSchema = z.object({
    items: z.array(rentalItem).min(1).max(50),
    rentalDate: dateString.optional(),
    dueDate: dateString,
});

export const extendRentalSchema = z.object({ newDueDate: dateString });

export const rentalStatusSchema = z.object({ status: z.enum(['Rented', 'Overdue']) });

export const rentalPaymentSchema = z.object({ paymentStatus: z.enum(['Paid', 'Pending', 'Partial']) });

export const processReturnSchema = z.object({
    rentalId: objectId,
    returnDate: dateString,
    damages: z
        .array(
            z.object({
                itemId: objectId,
                charge: z.coerce.number().min(0).max(10_000_000),
                note: z.string().trim().max(500).optional(),
            })
        )
        .max(50)
        .optional(),
    lateFeeOverride: z.coerce.number().min(0).max(10_000_000).optional(),
    paymentStatus: z.enum(['Paid', 'Pending', 'Partial']),
    notes: z.string().trim().max(1000).optional(),
});

export const rentalListQuery = paginationQuery.extend({ status: z.string().optional() });

// ─── Studio rentals ────────────────────────────────────────────────────────

export const createStudioRentalSchema = z.object({
    customerId: objectId,
    roomId: objectId,
    startTime: dateString,
    endTime: dateString,
    paymentStatus: z.enum(['Paid', 'Pending']).default('Pending'),
    notes: z.string().trim().max(1000).optional(),
});

export const updateStudioRentalSchema = z.object({
    roomId: objectId.optional(),
    startTime: dateString.optional(),
    endTime: dateString.optional(),
    status: z.enum(['Confirmed', 'Cancelled', 'Completed']).optional(),
    paymentStatus: z.enum(['Paid', 'Pending']).optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const studioStatusSchema = z.object({ status: z.enum(['Confirmed', 'Cancelled', 'Completed']) });

export const availabilityQuery = z.object({
    roomId: objectId,
    from: dateString,
    to: dateString,
});

// ─── Invoices ──────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
    customerId: objectId,
    productRentalIds: z.array(objectId).max(50).default([]),
    studioRentalIds: z.array(objectId).max(50).default([]),
    manualItems: z
        .array(
            z.object({
                description: z.string().trim().min(1).max(200),
                quantity: z.coerce.number().int().min(1).max(1000),
                unitPrice: z.coerce.number().min(0).max(10_000_000),
            })
        )
        .max(50)
        .default([]),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    paymentMethod,
    paymentStatus: z.enum(['Paid', 'Pending']).default('Pending'),
    notes: z.string().trim().max(1000).optional(),
});

export const invoicePaymentSchema = z.object({ paymentStatus: z.enum(['Paid', 'Pending']) });

export const invoiceListQuery = paginationQuery.extend({ paymentStatus: z.string().optional() });

// ─── Stats ─────────────────────────────────────────────────────────────────

export const statsQuery = dateRangeQuery;
