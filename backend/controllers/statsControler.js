const ProductRental = require('../models/ProductRental');
const StudioRental = require('../models/StudioRental');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Invoice = require('../models/Invoice');

// GET /api/stats/summary
exports.getSummary = async (req, res) => {
    try {
        const { start, end } = req.query;
        let dateFilter = {};
        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = new Date(start);
            if (end) {
                const endDate = new Date(end);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.updatedAt.$lte = endDate;
            }
        }

        const [
            activeProductRentals, overdueRentals, activeStudioRentals, totalCustomers, inventoryItems, paidInvoices, pendingInvoicesData,] = await Promise.all([
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
        const pendingPayments = pendingInvoicesData.reduce((s, inv) => s + inv.totalAmount, 0);

        // sum of all paid invoices
        const revenueAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid', ...dateFilter } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;
        res.json({
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
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/stats/monthly  — last 6 months
exports.getMonthly = async (req, res) => {
    try {
        const { start, end } = req.query;
        let dateFilter = {};
        let monthsToShow = 6;
        let referenceDate = new Date();

        if (start || end) {
            dateFilter.updatedAt = {};
            if (start) dateFilter.updatedAt.$gte = new Date(start);
            if (end) {
                const endDate = new Date(end);
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

        // Get all paid invoices in the date range to split revenue correctly
        const allInvoices = await Invoice.find({ paymentStatus: 'Paid', ...dateFilter });
        
        const monthlyStats = {};

        allInvoices.forEach(inv => {
            const date = new Date(inv.updatedAt);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyStats[key]) {
                monthlyStats[key] = { productRevenue: 0, studioRevenue: 0, count: 0 };
            }
            
            const hasProducts = (inv.productRentals && inv.productRentals.length > 0) || 
                               (inv.items && inv.items.some(item => item.description.toLowerCase().includes('rental') && !item.description.toLowerCase().includes('studio')));
            const hasStudio = (inv.studioRentals && inv.studioRentals.length > 0) ||
                             (inv.items && inv.items.some(item => item.description.toLowerCase().includes('studio')));

            if (hasProducts && hasStudio) {
                let prAmount = 0;
                let srAmount = 0;
                inv.items.forEach(item => {
                    if (item.description.toLowerCase().includes('studio')) {
                        srAmount += (item.price * item.quantity);
                    } else {
                        prAmount += (item.price * item.quantity);
                    }
                });
                // Add tax proportionally if available
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
                // General invoice (no linked rentals, e.g. direct sale)
                monthlyStats[key].productRevenue += inv.totalAmount;
            }
            monthlyStats[key].count++;
        });

        const months = [];
        if (start && end) {
            let curr = new Date(start);
            curr.setDate(1);
            const stop = new Date(end);
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
        const result = months.map(m => {
            const key = `${m.year}-${m.month}`;
            const stats = monthlyStats[key] || { productRevenue: 0, studioRevenue: 0, count: 0 };
            return {
                month: m.label,
                productRentalRevenue: stats.productRevenue,
                studioRentalRevenue: stats.studioRevenue,
                totalBookings: stats.count,
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};