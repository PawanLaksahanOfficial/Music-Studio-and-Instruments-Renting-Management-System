const ProductRental = require('../models/ProductRental');
const StudioRental = require('../models/StudioRental');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Invoice = require('../models/Invoice');

// GET /api/stats/summary
exports.getSummary = async (req, res) => {
    try {
        const [
            activeProductRentals,overdueRentals,activeStudioRentals,totalCustomers,inventoryItems,paidInvoices,pendingInvoicesData,] = await Promise.all([
            ProductRental.countDocuments({ status: 'Rented', isDeleted: false }),
            ProductRental.countDocuments({ status: 'Overdue', isDeleted: false }),
            StudioRental.countDocuments({ status: 'Confirmed', isDeleted: false }),
            Customer.countDocuments(),
            Inventory.find(),
            Invoice.countDocuments({ paymentStatus: 'Paid' }),
            Invoice.find({ paymentStatus: 'Pending' }),
        ]);
        const totalInventoryItems = inventoryItems.length;
        const availableItems = inventoryItems.filter(i => i.status === 'Available').length;
        const rentedItems = inventoryItems.filter(i => i.status === 'Rented').length;
        const pendingInvoices = pendingInvoicesData.length;
        const pendingPayments = pendingInvoicesData.reduce((s, inv) => s + inv.totalAmount, 0);
        // sum of all paid invoices
        const revenueAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid' } },
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
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        // Monthly product rental revenue
        const productRevAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid', productRental: { $ne: null }, createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: '$totalAmount' },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        // Monthly studio rental revenue
        const studioRevAgg = await Invoice.aggregate([
            { $match: { paymentStatus: 'Paid', studioRental: { $ne: null }, createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: '$totalAmount' }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                label: d.toLocaleString('default', { month: 'short', year: '2-digit' })
            });
        }
        const result = months.map(m => {
            const pr = productRevAgg.find(r => r._id.year === m.year && r._id.month === m.month);
            const sr = studioRevAgg.find(r => r._id.year === m.year && r._id.month === m.month);
            return {
                month: m.label,
                productRentalRevenue: pr?.revenue || 0,
                studioRentalRevenue: sr?.revenue || 0,
                totalBookings: (pr?.count || 0),
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};