import { describe, it, expect } from 'vitest';
import { currency, formatDate, toDateInput } from './format';

describe('currency', () => {
    it('formats a positive amount with the Rs. prefix and two decimals', () => {
        expect(currency(1500)).toBe('Rs. 1,500.00');
    });

    it('renders an em dash for null or undefined rather than "Rs. NaN"', () => {
        expect(currency(null)).toBe('—');
        expect(currency(undefined)).toBe('—');
    });

    it('formats zero explicitly rather than falling through to the dash', () => {
        expect(currency(0)).toBe('Rs. 0.00');
    });
});

describe('formatDate', () => {
    it('renders a dash for a missing date', () => {
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate(null)).toBe('—');
    });

    it('formats an ISO date as day-month-year', () => {
        expect(formatDate('2026-03-15T00:00:00.000Z')).toMatch(/15 Mar 2026/);
    });
});

describe('toDateInput', () => {
    it('round-trips a Date to YYYY-MM-DD in local time', () => {
        const d = new Date(2026, 2, 5); // 5 Mar 2026, local
        expect(toDateInput(d)).toBe('2026-03-05');
    });

    it('returns an empty string for a missing value', () => {
        expect(toDateInput(undefined)).toBe('');
        expect(toDateInput(null)).toBe('');
    });

    it('returns an empty string for an unparsable date', () => {
        expect(toDateInput('not-a-date')).toBe('');
    });
});
