import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import Invoice from '../models/Invoice';

class StatsService {
    async getDashboard(query: any): Promise<any> {
        const { start, end } = query;
        let dateFilter: any = {};
        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = new Date(start as string);
            if (end) {
                const endDate = new Date(end as string);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.updatedAt.$lte = endDate;
            }
        }

        // ── Most Rented Instruments ──
        const mostRented = await ProductRental.aggregate([
            { $match: { isDeleted: false, isArchived: false } },
            { $unwind: '$items' },
            { $group: { _id: '$items.itemId', rentalCount: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
            { $sort: { rentalCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'inventories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'item'
                }
            },
            { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    itemId: '$_id',
                    itemName: '$item.itemName',
                    brand: '$item.brand',
                    serialNumber: '$item.serialNumber',
                    rentalCount: 1,
                    totalRevenue: 1,
                }
            }
        ]);

        // ── Late Return Statistics ──
        const lateReturns = await ProductRental.aggregate([
            { $match: { status: 'Returned', isDeleted: false, isArchived: false, returnDate: { $ne: null }, dueDate: { $ne: null } } },
            {
                $project: {
                    lateDays: {
                        $ceil: {
                            $divide: [
                                { $subtract: ['$returnDate', '$dueDate'] },
                                86400000
                            ]
                        }
                    },
                    lateFee: { $ifNull: ['$lateFee', 0] },
                    totalAmount: 1,
                    rentalDate: 1,
                    dueDate: 1,
                    returnDate: 1,
                    customer: 1,
                }
            },
            { $match: { lateDays: { $gt: 0 } } },
            { $sort: { lateDays: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customerData'
                }
            },
            { $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    customerName: { $concat: ['$customerData.firstName', ' ', '$customerData.lastName'] },
                    lateDays: 1,
                    lateFee: 1,
                    totalAmount: 1,
                    rentalDate: 1,
                    dueDate: 1,
                    returnDate: 1,
                }
            }
        ]);

        const totalLateReturns = lateReturns.length;
        const totalLateFeeCollected = lateReturns.reduce((sum: number, r: any) => sum + (r.lateFee || 0), 0);
        const avgLateDays = totalLateReturns > 0
            ? Math.round(lateReturns.reduce((sum: number, r: any) => sum + (r.lateDays || 0), 0) / totalLateReturns)
            : 0;

        // ── Top Customers ──
        const topCustomers = await ProductRental.aggregate([
            { $match: { isDeleted: false, isArchived: false } },
            { $group: { _id: '$customer', totalRentals: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' }, totalLateFees: { $sum: { $ifNull: ['$lateFee', 0] } }, totalDamages: { $sum: { $ifNull: ['$damageCharges', 0] } } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerData'
                }
            },
            { $unwind: { path: '$customerData', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    customerId: '$_id',
                    customerName: { $concat: ['$customerData.firstName', ' ', '$customerData.lastName'] },
                    phone: '$customerData.phone',
                    totalRentals: 1,
                    totalSpent: 1,
                    totalLateFees: 1,
                    totalDamages: 1,
                }
            }
        ]);

        // ── Maintenance Cost Trends (items marked Damaged) ──
        const damagedByMonth = await ProductRental.aggregate([
            { $match: { isDeleted: false, isArchived: false, damageCharges: { $gt: 0 }, returnDate: { $ne: null } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$returnDate' },
                        month: { $month: '$returnDate' },
                    },
                    totalDamageCharges: { $sum: '$damageCharges' },
                    count: { $sum: 1 },
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        // ── Rental Growth (monthly new rentals) ──
        const rentalGrowth = await ProductRental.aggregate([
            { $match: { isDeleted: false, isArchived: false } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    newRentals: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' },
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        // Format damaged by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const damageTrend = damagedByMonth.map((d: any) => ({
            month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
            charges: d.totalDamageCharges,
            count: d.count,
        })).reverse();

        const growthTrend = rentalGrowth.map((d: any) => ({
            month: `${monthNames[d._id.month - 1]} ${d._id.year}`,
            newRentals: d.newRentals,
            revenue: d.revenue,
        })).reverse();

        return {
            mostRentedInstruments: mostRented,
            lateReturns: {
                records: lateReturns.slice(0, 10),
                totalLateReturns,
                totalLateFeeCollected,
                avgLateDays,
            },
            topCustomers,
            damageTrend,
            rentalGrowth: growthTrend,
        };
    }

    async getSummary(query: any): Promise<any> {
        const { start, end } = query;
        let dateFilter: any = {};
        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = new Date(start as string);
            if (end) {
                const endDate = new Date(end as string);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.updatedAt.$lte = endDate;
            }
        }
        const [
            activeProductRentals, overdueRentals, activeStudioRentals, totalCustomers, inventoryItems, paidInvoices, pendingInvoicesData,
        ] = await Promise.all([
            ProductRental.countDocuments({ status: 'Rented', isDeleted: false }),
            ProductRental.countDocuments({ status: 'Overdue', isDeleted: false }),
            StudioRental.countDocuments({ status: 'Confirmed', isDeleted: false }),
            Customer.countDocuments(),
            Inventory.find(),
            Invoice.countDocuments({ paymentStatus: 'Paid', ...dateFilter }),
            Invoice.find({ paymentStatus: 'Pending', ...dateFilter }),
        ]);
        const totalInventoryItems = inventoryItems.length;
        const availableItems = inventoryItems.filter(i => i.status === 'Available').length;
        const rentedItems = inventoryItems.filter(i => i.status === 'Rented').length;
        const pendingInvoices = pendingInvoicesData.length;
        const pendingPayments = (pendingInvoicesData as any[]).reduce((s, inv) => s + inv.totalAmount, 0);
        const revenueAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid', ...dateFilter } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;
        return {
            totalRevenue,
            activeProductRentals,
            overdueRentals,
            activeStudioRentals,
            totalCustomers,
            totalInventoryItems,
            availableItems,
            rentedItems,
            paidInvoices,
            pendingInvoices,
            pendingPayments,
        };
    }

    async getMonthly(query: any): Promise<any> {
        const { start, end } = query;
        let dateFilter: any = {};
        let referenceDate = new Date();
        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = new Date(start as string);
            if (end) {
                const endDate = new Date(end as string);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.updatedAt.$lte = endDate;
                referenceDate = new Date(endDate);
            }
        } else {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);
            dateFilter.updatedAt = { $gte: sixMonthsAgo };
        }
        const allInvoices = await Invoice.find({ paymentStatus: 'Paid', ...dateFilter });
        const monthlyStats: any = {};
        allInvoices.forEach((inv: any) => {
            const date = new Date(inv.updatedAt);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyStats[key]) {
                monthlyStats[key] = { productRevenue: 0, studioRevenue: 0, count: 0 };
            } 
            const hasProducts = (inv.productRentals && inv.productRentals.length > 0) || 
                               (inv.items && inv.items.some((item: any) => item.description.toLowerCase().includes('rental') && !item.description.toLowerCase().includes('studio')));
            const hasStudio = (inv.studioRentals && inv.studioRentals.length > 0) ||
                             (inv.items && inv.items.some((item: any) => item.description.toLowerCase().includes('studio')));
            if (hasProducts && hasStudio) {
                let prAmount = 0;
                let srAmount = 0;
                inv.items.forEach((item: any) => {
                    if (item.description.toLowerCase().includes('studio')) {
                        srAmount += (item.unitPrice * item.quantity);
                    } else {
                        prAmount += (item.unitPrice * item.quantity);
                    }
                });
                if (inv.tax > 0 && inv.subtotal > 0) {
                    const taxRate = inv.tax / inv.subtotal;
                    prAmount += prAmount * taxRate;
                    srAmount += srAmount * taxRate;
                }
                monthlyStats[key].productRevenue += prAmount;
                monthlyStats[key].studioRevenue += srAmount;
            } else if (hasProducts) {
                monthlyStats[key].productRevenue += inv.totalAmount;
            } else if (hasStudio) {
                monthlyStats[key].studioRevenue += inv.totalAmount;
            } else {
                monthlyStats[key].productRevenue += inv.totalAmount;
            }
            monthlyStats[key].count++;
        });

        const months: any[] = [];
        if (start && end) {
            let curr = new Date(start as string);
            curr.setDate(1);
            const stop = new Date(end as string);
            while (curr <= stop) {
                months.push({
                    year: curr.getFullYear(),
                    month: curr.getMonth() + 1,
                    label: curr.toLocaleString('default', { month: 'short', year: '2-digit' })
                });
                curr.setMonth(curr.getMonth() + 1);
            }
        } else {
            for (let i = 5; i >= 0; i--) {
                const d = new Date(referenceDate);
                d.setMonth(d.getMonth() - i);
                months.push({
                    year: d.getFullYear(),
                    month: d.getMonth() + 1,
                    label: d.toLocaleString('default', { month: 'short', year: '2-digit' })
                });
            }
        }
        return months.map(m => {
            const key = `${m.year}-${m.month}`;
            const stats = monthlyStats[key] || { productRevenue: 0, studioRevenue: 0, count: 0 };
            return {
                month: m.label,
                productRentalRevenue: stats.productRevenue,
                studioRentalRevenue: stats.studioRevenue,
                totalBookings: stats.count,
            };
        });
    }
}

export default new StatsService();
