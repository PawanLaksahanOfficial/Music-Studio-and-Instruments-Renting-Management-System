import { describe, it, expect } from 'vitest';
import {
    billableDays,
    daysLate,
    quoteProductRental,
    quoteStudioRental,
    calculateLateFee,
    totalInvoice,
    round2,
} from '../utils/pricing';

/**
 * Local-time construction, deliberately. Billing counts calendar days in the
 * studio's own timezone, so a UTC literal would make these assertions depend
 * on where the test happens to run.
 */
const d = (day: number, hour = 0) => new Date(2026, 0, day, hour, 0, 0);

describe('billableDays', () => {
    it('bills a same-day rental as one day', () => {
        expect(billableDays(d(10, 9), d(10, 17))).toBe(1);
    });

    it('counts whole days between dates', () => {
        expect(billableDays(d(10), d(13))).toBe(3);
    });

    it('ignores the time of day', () => {
        // 09:00 on the 10th → 23:00 on the 13th is still three calendar days.
        expect(billableDays(d(10, 9), d(13, 23))).toBe(3);
    });

    it('counts across a month boundary', () => {
        expect(billableDays(new Date(2026, 0, 30), new Date(2026, 1, 2))).toBe(3);
    });
});

describe('daysLate', () => {
    it('is zero when returned on the due date', () => {
        expect(daysLate(d(10), d(10, 18))).toBe(0);
    });

    it('is zero when returned early', () => {
        expect(daysLate(d(10), d(8))).toBe(0);
    });

    it('counts days past the due date', () => {
        expect(daysLate(d(10), d(14))).toBe(4);
    });
});

describe('quoteProductRental', () => {
    const inventory = [
        { _id: 'a', itemName: 'Guitar', baseRentalPrice: 1000 },
        { _id: 'b', itemName: 'Amp', baseRentalPrice: 500 },
    ];

    it('prices from stored rates, quantity and duration', () => {
        const quote = quoteProductRental(
            inventory,
            [
                { itemId: 'a', quantity: 1 },
                { itemId: 'b', quantity: 2 },
            ],
            d(10),
            d(13)
        );

        expect(quote.days).toBe(3);
        // (1000 × 1 × 3) + (500 × 2 × 3)
        expect(quote.baseAmount).toBe(6000);
        expect(quote.lines).toHaveLength(2);
    });

    it('rejects an item that is not in the supplied inventory', () => {
        expect(() =>
            quoteProductRental(inventory, [{ itemId: 'missing', quantity: 1 }], d(10), d(11))
        ).toThrow(/not found while pricing/);
    });
});

describe('calculateLateFee', () => {
    it('charges the daily rate for each late day', () => {
        expect(calculateLateFee(1500, d(10), d(13))).toBe(4500);
    });

    it('charges nothing for an on-time return', () => {
        expect(calculateLateFee(1500, d(10), d(10))).toBe(0);
    });
});

describe('quoteStudioRental', () => {
    it('prices by the hour', () => {
        const q = quoteStudioRental(2000, new Date(2026, 0, 10, 10, 0), new Date(2026, 0, 10, 13, 30));
        expect(q.durationHours).toBe(3.5);
        expect(q.baseAmount).toBe(7000);
    });
});

describe('totalInvoice', () => {
    it('sums lines and applies the tax rate', () => {
        const t = totalInvoice(
            [
                { quantity: 2, unitPrice: 1000 },
                { quantity: 1, unitPrice: 500 },
            ],
            10
        );
        expect(t.subtotal).toBe(2500);
        expect(t.tax).toBe(250);
        expect(t.totalAmount).toBe(2750);
    });

    it('handles a zero tax rate', () => {
        const t = totalInvoice([{ quantity: 3, unitPrice: 333.33 }]);
        expect(t.subtotal).toBe(999.99);
        expect(t.tax).toBe(0);
        expect(t.totalAmount).toBe(999.99);
    });
});

describe('round2', () => {
    it('rounds float artefacts away', () => {
        expect(round2(0.1 + 0.2)).toBe(0.3);
        expect(round2(1.005)).toBe(1.01);
    });
});
