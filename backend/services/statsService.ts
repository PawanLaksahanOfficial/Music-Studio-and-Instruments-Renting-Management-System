import { PipelineStage } from 'mongoose';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import Invoice from '../models/Invoice';
import { env } from '../config/env';
import { parseDateOnly, todayDateOnly, zonedEndOfDay, zonedStartOfDay } from '../utils/dates';
import { roundMoney } from '../utils/money';

export interface DateRange {
    start?: string;
    end?: string;
}

type Bounds = { $gte?: Date; $lt?: Date; $lte?: Date };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (key: string) => {
    const [year, month] = key.split('-');
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
};

/** Bounds for real timestamps (createdAt, paidAt), with days resolved in the business timezone. */
const instantBounds = ({ start, end }: DateRange): Bounds | undefined => {
    if (!start && !end) return undefined;
    return {
        ...(start ? { $gte: zonedStartOfDay(start) } : {}),
        ...(end ? { $lt: zonedEndOfDay(end) } : {}),
    };
};

/** Bounds for calendar-date fields stored as UTC midnight (returnDate, dueDate). */
const calendarBounds = ({ start, end }: DateRange): Bounds | undefined => {
    if (!start && !end) return undefined;
    return {
        ...(start ? { $gte: parseDateOnly(start) } : {}),
        ...(end ? { $lte: parseDateOnly(end) } : {}),
    };
};

/** Revenue is dated by when it was paid; invoices from before `paidAt` existed fall back to updatedAt. */
const REVENUE_DATE = { $ifNull: ['$paidAt', '$updatedAt'] };

const monthKey = (field: string, timezone: string) => ({ $dateToString: { format: '%Y-%m', date: field, timezone } });

/** "YYYY-MM" keys from the month containing `from` to the month containing `to`, inclusive. */
const monthKeysBetween = (from: string, to: string) => {
    const keys: string[] = [];
    let [year, month] = from.split('-').map(Number);
    const [endYear, endMonth] = to.split('-').map(Number);
    while (year < endYear || (year === endYear && month <= endMonth)) {
        keys.push(`${year}-${String(month).padStart(2, '0')}`);
        month += 1;
        if (month > 12) { month = 1; year += 1; }
    }
    return keys;
};

class StatsService {
    async getSummary(range: DateRange) {
        const paidRange = instantBounds(range);
        const now = new Date();

        const [activeProductRentals, overdueRentals, activeStudioRentals, totalCustomers, inventoryByStatus, invoiceTotals] = await Promise.all([
            ProductRental.countDocuments({ status: 'Rented', isDeleted: false }),
            ProductRental.countDocuments({ status: 'Overdue', isDeleted: false }),
            StudioRental.countDocuments({ status: 'Confirmed', isDeleted: false, endTime: { $gte: now } }),
            Customer.countDocuments({ isArchived: false }),
            Inventory.aggregate<{ _id: string; count: number }>([
                { $match: { isArchived: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Invoice.aggregate<{ paid: { count: number; total: number }[]; pending: { count: number; total: number }[] }>([
                {
                    $facet: {
                        paid: [
                            { $match: { paymentStatus: 'Paid' } },
                            { $addFields: { revenueDate: REVENUE_DATE } },
                            ...(paidRange ? [{ $match: { revenueDate: paidRange } }] : []),
                            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
                        ],
                        pending: [
                            { $match: { paymentStatus: 'Pending', ...(paidRange ? { createdAt: paidRange } : {}) } },
                            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
                        ],
                    },
                },
            ]),
        ]);

        const byStatus = Object.fromEntries(inventoryByStatus.map(s => [s._id, s.count])) as Record<string, number>;
        const inventory = {
            total: inventoryByStatus.reduce((sum, s) => sum + s.count, 0),
            available: byStatus.Available ?? 0,
            rented: byStatus.Rented ?? 0,
            maintenance: byStatus.Maintenance ?? 0,
            damaged: byStatus.Damaged ?? 0,
            lost: byStatus.Lost ?? 0,
        };
        const paid = invoiceTotals[0]?.paid[0];
        const pending = invoiceTotals[0]?.pending[0];

        return {
            totalRevenue: roundMoney(paid?.total ?? 0),
            paidInvoices: paid?.count ?? 0,
            pendingInvoices: pending?.count ?? 0,
            pendingPayments: roundMoney(pending?.total ?? 0),
            activeProductRentals,
            overdueRentals,
            activeStudioRentals,
            totalCustomers,
            inventory,
        };
    }

    /** Paid revenue per month split into product, studio and other, with tax spread proportionally. */
    async getMonthly(range: DateRange) {
        const tz = env.APP_TIMEZONE;
        const today = todayDateOnly(tz);
        let fromDay = range.start;
        if (!fromDay) {
            const [y, m] = today.split('-').map(Number);
            const back = new Date(Date.UTC(y, m - 1 - 5, 1)); // first day of the month five months ago
            fromDay = back.toISOString().slice(0, 10);
        }
        const toDay = range.end ?? today;

        const rows = await Invoice.aggregate<{ _id: { month: string; kind: string }; revenue: number; invoices: string[] }>([
            { $match: { paymentStatus: 'Paid' } },
            { $addFields: { revenueDate: REVENUE_DATE } },
            { $match: { revenueDate: { $gte: zonedStartOfDay(fromDay), $lt: zonedEndOfDay(toDay) } } },
            {
                $addFields: {
                    month: monthKey('$revenueDate', tz),
                    taxRate: { $cond: [{ $gt: ['$subtotal', 0] }, { $divide: ['$tax', '$subtotal'] }, 0] },
                },
            },
            { $unwind: '$items' },
            {
                $addFields: {
                    kind: {
                        $ifNull: [
                            '$items.kind',
                            { $cond: [{ $regexMatch: { input: '$items.description', regex: /studio/i } }, 'studio', 'product'] },
                        ],
                    },
                    amount: { $multiply: ['$items.total', { $add: [1, '$taxRate'] }] },
                },
            },
            { $group: { _id: { month: '$month', kind: '$kind' }, revenue: { $sum: '$amount' }, invoices: { $addToSet: '$_id' } } },
        ]);

        const months = new Map(monthKeysBetween(fromDay, toDay).map(key => [key, {
            product: 0, studio: 0, other: 0, invoices: new Set<string>(),
        }]));
        for (const row of rows) {
            const bucket = months.get(row._id.month);
            if (!bucket) continue;
            const kind = row._id.kind as 'product' | 'studio' | 'other';
            bucket[kind] += row.revenue;
            row.invoices.forEach(id => bucket.invoices.add(String(id)));
        }

        return [...months.entries()].map(([key, m]) => ({
            month: monthLabel(key),
            productRentalRevenue: roundMoney(m.product),
            studioRentalRevenue: roundMoney(m.studio),
            otherRevenue: roundMoney(m.other),
            totalBookings: m.invoices.size,
        }));
    }

    async getDashboard(range: DateRange) {
        const tz = env.APP_TIMEZONE;
        const created = instantBounds(range);
        const returned = calendarBounds(range);
        const notDeleted = { isDeleted: false };

        const lookupCustomer: PipelineStage.FacetPipelineStage[] = [
            { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customerData' } },
            { $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
        ];
        const customerName = { $trim: { input: { $concat: [{ $ifNull: ['$customerData.firstName', ''] }, ' ', { $ifNull: ['$customerData.lastName', ''] }] } } };

        const [mostRented, lateReturns, topCustomers, damageTrend, rentalGrowth] = await Promise.all([
            ProductRental.aggregate([
                { $match: { ...notDeleted, ...(created ? { createdAt: created } : {}) } },
                { $addFields: { itemShare: { $divide: ['$totalAmount', { $max: [1, { $size: '$items' }] }] } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.itemId', rentalCount: { $sum: 1 }, totalRevenue: { $sum: '$itemShare' } } },
                { $sort: { rentalCount: -1, totalRevenue: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'item' } },
                { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0, itemId: '$_id', itemName: '$item.itemName', brand: '$item.brand',
                        serialNumber: '$item.serialNumber', rentalCount: 1, totalRevenue: { $round: ['$totalRevenue', 2] },
                    },
                },
            ]),
            ProductRental.aggregate([
                { $match: { ...notDeleted, status: 'Returned', returnDate: { $ne: null, ...(returned ?? {}) }, dueDate: { $ne: null } } },
                { $addFields: { lateDays: { $dateDiff: { startDate: '$dueDate', endDate: '$returnDate', unit: 'day' } } } },
                { $match: { lateDays: { $gt: 0 } } },
                {
                    $facet: {
                        totals: [{ $group: { _id: null, count: { $sum: 1 }, fees: { $sum: { $ifNull: ['$lateFee', 0] } }, avgDays: { $avg: '$lateDays' } } }],
                        records: [
                            { $sort: { lateDays: -1, returnDate: -1 } },
                            { $limit: 10 },
                            ...lookupCustomer,
                            {
                                $project: {
                                    rentalId: 1, customerName, lateDays: 1, lateFee: { $ifNull: ['$lateFee', 0] },
                                    totalAmount: 1, rentalDate: 1, dueDate: 1, returnDate: 1,
                                },
                            },
                        ],
                    },
                },
            ]),
            ProductRental.aggregate([
                { $match: { ...notDeleted, ...(created ? { createdAt: created } : {}) } },
                {
                    $group: {
                        _id: '$customer',
                        totalRentals: { $sum: 1 },
                        totalSpent: { $sum: '$totalAmount' },
                        totalLateFees: { $sum: { $ifNull: ['$lateFee', 0] } },
                        totalDamages: { $sum: { $ifNull: ['$damageCharges', 0] } },
                    },
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 10 },
                { $addFields: { customer: '$_id' } },
                ...lookupCustomer,
                {
                    $project: {
                        _id: 0, customerId: '$_id', customerName, phone: '$customerData.phone',
                        totalRentals: 1, totalSpent: 1, totalLateFees: 1, totalDamages: 1,
                    },
                },
            ]),
            ProductRental.aggregate<{ _id: string; charges: number; count: number }>([
                { $match: { ...notDeleted, damageCharges: { $gt: 0 }, returnDate: { $ne: null, ...(returned ?? {}) } } },
                { $group: { _id: monthKey('$returnDate', 'UTC'), charges: { $sum: '$damageCharges' }, count: { $sum: 1 } } },
                { $sort: { _id: -1 } },
                { $limit: 12 },
            ]),
            ProductRental.aggregate<{ _id: string; newRentals: number; revenue: number }>([
                { $match: { ...notDeleted, ...(created ? { createdAt: created } : {}) } },
                { $group: { _id: monthKey('$createdAt', tz), newRentals: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                { $sort: { _id: -1 } },
                { $limit: 12 },
            ]),
        ]);

        const lateTotals = lateReturns[0]?.totals[0];

        return {
            mostRentedInstruments: mostRented,
            lateReturns: {
                records: lateReturns[0]?.records ?? [],
                totalLateReturns: lateTotals?.count ?? 0,
                totalLateFeeCollected: roundMoney(lateTotals?.fees ?? 0),
                avgLateDays: Math.round(lateTotals?.avgDays ?? 0),
            },
            topCustomers,
            damageTrend: damageTrend.reverse().map(d => ({ month: monthLabel(d._id), charges: roundMoney(d.charges), count: d.count })),
            rentalGrowth: rentalGrowth.reverse().map(g => ({ month: monthLabel(g._id), newRentals: g.newRentals, revenue: roundMoney(g.revenue) })),
        };
    }
}

export default new StatsService();
