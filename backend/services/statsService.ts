import { PipelineStage } from 'mongoose';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import Invoice from '../models/Invoice';
import { endOfDay, round2 } from '../utils/pricing';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DateRange {
    start?: string;
    end?: string;
}

/**
 * Builds a `$match` on the given field. Returns an empty object when no range
 * is supplied, so it can always be spread into a pipeline.
 */
const rangeMatch = (field: string, { start, end }: DateRange): Record<string, unknown> => {
    if (!start && !end) return {};
    const bounds: Record<string, Date> = {};
    if (start) bounds.$gte = new Date(start);
    if (end) bounds.$lte = endOfDay(new Date(end));
    return { [field]: bounds };
};

class StatsService {
    /**
     * Dashboard analytics. The date range now actually filters — it was
     * previously computed into a variable that no pipeline ever read.
     */
    async getDashboard(query: DateRange) {
        const rentalRange = rangeMatch('createdAt', query);
        const returnRange = rangeMatch('returnDate', query);
        const baseMatch = { isDeleted: false, isArchived: false };

        const [mostRented, lateReturnStats, lateReturnRecords, topCustomers, damageTrend, rentalGrowth] =
            await Promise.all([
                ProductRental.aggregate([
                    { $match: { ...baseMatch, ...rentalRange } },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.itemId',
                            rentalCount: { $sum: 1 },
                            totalRevenue: { $sum: '$totalAmount' },
                        },
                    },
                    { $sort: { rentalCount: -1 } },
                    { $limit: 10 },
                    { $lookup: { from: 'inventories', localField: '_id', foreignField: '_id', as: 'item' } },
                    { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            itemId: '$_id',
                            itemName: '$item.itemName',
                            brand: '$item.brand',
                            category: '$item.category',
                            serialNumber: '$item.serialNumber',
                            rentalCount: 1,
                            totalRevenue: { $round: ['$totalRevenue', 2] },
                        },
                    },
                ]),

                // Aggregated in the database rather than by summing a JS array,
                // so the totals cover every late return and not just the top 20.
                ProductRental.aggregate([
                    {
                        $match: {
                            ...baseMatch,
                            ...returnRange,
                            status: 'Returned',
                            returnDate: { $ne: null },
                        },
                    },
                    { $addFields: { lateDays: this.lateDaysExpr() } },
                    { $match: { lateDays: { $gt: 0 } } },
                    {
                        $group: {
                            _id: null,
                            totalLateReturns: { $sum: 1 },
                            totalLateFeeCollected: { $sum: { $ifNull: ['$lateFee', 0] } },
                            avgLateDays: { $avg: '$lateDays' },
                            maxLateDays: { $max: '$lateDays' },
                        },
                    },
                ]),

                ProductRental.aggregate([
                    {
                        $match: {
                            ...baseMatch,
                            ...returnRange,
                            status: 'Returned',
                            returnDate: { $ne: null },
                        },
                    },
                    { $addFields: { lateDays: this.lateDaysExpr() } },
                    { $match: { lateDays: { $gt: 0 } } },
                    { $sort: { lateDays: -1 } },
                    { $limit: 10 },
                    { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'c' } },
                    { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            rentalId: 1,
                            customerName: { $trim: { input: { $concat: ['$c.firstName', ' ', '$c.lastName'] } } },
                            lateDays: 1,
                            lateFee: { $ifNull: ['$lateFee', 0] },
                            totalAmount: 1,
                            rentalDate: 1,
                            dueDate: 1,
                            returnDate: 1,
                        },
                    },
                ]),

                ProductRental.aggregate([
                    { $match: { ...baseMatch, ...rentalRange } },
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
                    { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'c' } },
                    { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            customerId: '$_id',
                            customerName: { $trim: { input: { $concat: ['$c.firstName', ' ', '$c.lastName'] } } },
                            phone: '$c.phone',
                            totalRentals: 1,
                            totalSpent: { $round: ['$totalSpent', 2] },
                            totalLateFees: { $round: ['$totalLateFees', 2] },
                            totalDamages: { $round: ['$totalDamages', 2] },
                        },
                    },
                ]),

                ProductRental.aggregate([
                    {
                        $match: {
                            ...baseMatch,
                            ...returnRange,
                            damageCharges: { $gt: 0 },
                            returnDate: { $ne: null },
                        },
                    },
                    {
                        $group: {
                            _id: { year: { $year: '$returnDate' }, month: { $month: '$returnDate' } },
                            charges: { $sum: '$damageCharges' },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } },
                    { $limit: 12 },
                ]),

                ProductRental.aggregate([
                    { $match: { ...baseMatch, ...rentalRange } },
                    {
                        $group: {
                            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                            newRentals: { $sum: 1 },
                            revenue: { $sum: '$totalAmount' },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } },
                    { $limit: 12 },
                ]),
            ]);

        const late = lateReturnStats[0];

        return {
            mostRentedInstruments: mostRented,
            lateReturns: {
                records: lateReturnRecords,
                totalLateReturns: late?.totalLateReturns ?? 0,
                totalLateFeeCollected: round2(late?.totalLateFeeCollected ?? 0),
                avgLateDays: Math.round(late?.avgLateDays ?? 0),
                maxLateDays: late?.maxLateDays ?? 0,
            },
            topCustomers,
            damageTrend: damageTrend.map(d => ({
                month: this.monthLabel(d._id.year, d._id.month),
                charges: round2(d.charges),
                count: d.count,
            })),
            rentalGrowth: rentalGrowth.map(d => ({
                month: this.monthLabel(d._id.year, d._id.month),
                newRentals: d.newRentals,
                revenue: round2(d.revenue),
            })),
        };
    }

    /** Headline counters. Every figure is a database-side count or sum. */
    async getSummary(query: DateRange) {
        const invoiceRange = rangeMatch('paidAt', query);

        const [rentalCounts, studioCount, customerCount, inventoryByStatus, invoiceAgg] = await Promise.all([
            ProductRental.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            StudioRental.countDocuments({ status: 'Confirmed', isDeleted: false }),
            Customer.countDocuments({ isArchived: false }),
            // Counting by status in the database instead of loading every
            // inventory document into memory just to filter the array.
            Inventory.aggregate([
                { $match: { isArchived: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Invoice.aggregate([
                {
                    $group: {
                        _id: '$paymentStatus',
                        count: { $sum: 1 },
                        total: { $sum: '$totalAmount' },
                    },
                },
            ]),
        ]);

        const byStatus = (rows: Array<{ _id: string; count: number }>) =>
            Object.fromEntries(rows.map(r => [r._id, r.count]));

        const rentals = byStatus(rentalCounts);
        const inventory = byStatus(inventoryByStatus);
        const paid = invoiceAgg.find(i => i._id === 'Paid');
        const pending = invoiceAgg.find(i => i._id === 'Pending');

        // Revenue respects the date range; the counters above are point-in-time.
        const revenueAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid', ...invoiceRange } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        return {
            totalRevenue: round2(revenueAgg[0]?.total ?? 0),
            activeProductRentals: rentals.Rented ?? 0,
            overdueRentals: rentals.Overdue ?? 0,
            returnedRentals: rentals.Returned ?? 0,
            activeStudioRentals: studioCount,
            totalCustomers: customerCount,
            totalInventoryItems: Object.values(inventory).reduce((a, b) => a + b, 0),
            availableItems: inventory.Available ?? 0,
            rentedItems: inventory.Rented ?? 0,
            damagedItems: inventory.Damaged ?? 0,
            maintenanceItems: inventory.Maintenance ?? 0,
            paidInvoices: paid?.count ?? 0,
            pendingInvoices: pending?.count ?? 0,
            pendingPayments: round2(pending?.total ?? 0),
        };
    }

    /**
     * Monthly revenue split by source. The split now keys off each line's
     * `sourceType` rather than substring-matching its description, so renaming
     * a line item no longer moves money between categories.
     */
    async getMonthly(query: DateRange) {
        const { from, to, months } = this.resolveMonthWindow(query);

        const pipeline: PipelineStage[] = [
            { $match: { paymentStatus: 'Paid', paidAt: { $gte: from, $lte: to } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: {
                        year: { $year: '$paidAt' },
                        month: { $month: '$paidAt' },
                        sourceType: '$items.sourceType',
                    },
                    // Line totals are grossed up by the invoice's tax rate so the
                    // monthly figures reconcile with the invoice totals.
                    revenue: {
                        $sum: {
                            $multiply: ['$items.total', { $add: [1, { $divide: [{ $ifNull: ['$taxRate', 0] }, 100] }] }],
                        },
                    },
                    invoiceIds: { $addToSet: '$_id' },
                },
            },
        ];

        const rows = await Invoice.aggregate(pipeline);

        const bucket = new Map<string, { product: number; studio: number; other: number; invoices: Set<string> }>();
        for (const row of rows) {
            const key = `${row._id.year}-${row._id.month}`;
            const entry = bucket.get(key) ?? { product: 0, studio: 0, other: 0, invoices: new Set<string>() };
            if (row._id.sourceType === 'ProductRental') entry.product += row.revenue;
            else if (row._id.sourceType === 'StudioRental') entry.studio += row.revenue;
            else entry.other += row.revenue;
            row.invoiceIds.forEach((id: unknown) => entry.invoices.add(String(id)));
            bucket.set(key, entry);
        }

        return months.map(m => {
            const entry = bucket.get(`${m.year}-${m.month}`);
            return {
                month: m.label,
                productRentalRevenue: round2(entry?.product ?? 0),
                studioRentalRevenue: round2(entry?.studio ?? 0),
                otherRevenue: round2(entry?.other ?? 0),
                totalBookings: entry?.invoices.size ?? 0,
            };
        });
    }

    /** Days a return was late, as an aggregation expression. */
    private lateDaysExpr() {
        return {
            $max: [
                0,
                {
                    $ceil: {
                        $divide: [{ $subtract: ['$returnDate', '$dueDate'] }, 86400000],
                    },
                },
            ],
        };
    }

    private monthLabel(year: number, month: number) {
        return `${MONTH_NAMES[month - 1]} ${year}`;
    }

    /** Resolves the requested range to whole months, defaulting to the last six. */
    private resolveMonthWindow({ start, end }: DateRange) {
        const to = end ? endOfDay(new Date(end)) : endOfDay(new Date());
        let from: Date;
        if (start) {
            from = new Date(start);
        } else {
            from = new Date(to);
            from.setMonth(from.getMonth() - 5);
        }
        from.setDate(1);
        from.setHours(0, 0, 0, 0);

        const months: Array<{ year: number; month: number; label: string }> = [];
        const cursor = new Date(from);
        while (cursor <= to && months.length < 36) {
            months.push({
                year: cursor.getFullYear(),
                month: cursor.getMonth() + 1,
                label: cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return { from, to, months };
    }
}

export default new StatsService();
