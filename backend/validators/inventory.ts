import { z } from 'zod';
import { INVENTORY_CATEGORIES } from '../config/constants';
import { dateOnly, money, optionalText, requiredText } from './common';

/** Statuses staff may set by hand. "Rented" is only ever set by the rental workflow. */
export const MANUAL_INVENTORY_STATUSES = ['Available', 'Maintenance', 'Damaged', 'Lost'] as const;

const optionalDate = z.union([z.literal(''), dateOnly]).optional();

// No .default() here: zod 4 applies defaults even inside .partial(), which would reset fields on update.
const inventoryFields = z.object({
    itemName: requiredText(100),
    category: z.enum(INVENTORY_CATEGORIES),
    brand: optionalText(60),
    itemModel: optionalText(60),
    status: z.enum(MANUAL_INVENTORY_STATUSES),
    baseRentalPrice: money,
    purchaseDate: optionalDate,
    notes: optionalText(500),
});

export const createInventoryBody = inventoryFields.extend({
    serialNumber: requiredText(60),
    status: z.enum(MANUAL_INVENTORY_STATUSES).default('Available'),
});

export const updateInventoryBody = inventoryFields.extend({ lastMaintenance: optionalDate }).partial();

export const qrParams = z.object({
    qrCodeId: z.string().trim().min(1).max(300),
});
