/**
 * Money is computed here, on the server, from stored rates — never taken from
 * the request body. A client that can post its own `totalAmount` can rent a
 * grand piano for zero rupees.
 *
 * All amounts are rounded to 2 decimals at the boundary to avoid float drift
 * accumulating across line items.
 */

export const MS_PER_DAY = 86_400_000;

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Billable days between two dates. A same-day return still bills one day,
 * which matches how the studio actually charges.
 */
export const billableDays = (from: Date, to: Date): number => {
    const start = startOfDay(from).getTime();
    const end = startOfDay(to).getTime();
    return Math.max(1, Math.ceil((end - start) / MS_PER_DAY));
};

/** Whole days `to` falls after `from`; 0 when not late. */
export const daysLate = (dueDate: Date, returnDate: Date): number => {
    const due = startOfDay(dueDate).getTime();
    const ret = startOfDay(returnDate).getTime();
    return Math.max(0, Math.ceil((ret - due) / MS_PER_DAY));
};

export const startOfDay = (d: Date): Date => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

export const endOfDay = (d: Date): Date => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
};

export interface PricedLine {
    itemId: string;
    itemName: string;
    quantity: number;
    dailyRate: number;
    days: number;
    lineTotal: number;
}

export interface RentalQuote {
    days: number;
    lines: PricedLine[];
    baseAmount: number;
}

interface PriceableItem {
    _id: unknown;
    itemName: string;
    baseRentalPrice: number;
}

/**
 * Prices a product rental from the inventory's stored daily rates.
 * `items` carries only ids and quantities — the rate always comes from the DB.
 */
export const quoteProductRental = (
    inventory: PriceableItem[],
    items: Array<{ itemId: string; quantity: number }>,
    rentalDate: Date,
    dueDate: Date
): RentalQuote => {
    const days = billableDays(rentalDate, dueDate);
    const byId = new Map(inventory.map(i => [String(i._id), i]));

    const lines = items.map(({ itemId, quantity }) => {
        const item = byId.get(String(itemId));
        if (!item) throw new Error(`Inventory item ${itemId} not found while pricing`);
        const qty = Math.max(1, quantity || 1);
        return {
            itemId: String(itemId),
            itemName: item.itemName,
            quantity: qty,
            dailyRate: item.baseRentalPrice,
            days,
            lineTotal: round2(item.baseRentalPrice * qty * days),
        };
    });

    return { days, lines, baseAmount: round2(lines.reduce((sum, l) => sum + l.lineTotal, 0)) };
};

/**
 * Late fee = the item's daily rate for each day past the due date, so a late
 * return costs what continuing to rent would have cost.
 */
export const calculateLateFee = (dailyRateTotal: number, dueDate: Date, returnDate: Date): number =>
    round2(dailyRateTotal * daysLate(dueDate, returnDate));

export const quoteStudioRental = (hourlyRate: number, startTime: Date, endTime: Date) => {
    const durationHours = round2((endTime.getTime() - startTime.getTime()) / 3_600_000);
    return { durationHours, baseAmount: round2(hourlyRate * durationHours) };
};

/** Sums invoice lines and applies a tax rate expressed as a percentage. */
export const totalInvoice = (lines: Array<{ quantity: number; unitPrice: number }>, taxRate = 0) => {
    const subtotal = round2(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
    const tax = round2(subtotal * (taxRate / 100));
    return { subtotal, tax, totalAmount: round2(subtotal + tax) };
};
