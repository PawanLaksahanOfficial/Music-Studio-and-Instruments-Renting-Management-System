const Invoice = require('../models/Invoice');
const StudioRental = require('../models/StudioRental');
const ProductRental = require('../models/ProductRental');

// GET /api/invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/invoices/:id
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/invoices
exports.createInvoice = async (req, res) => {
    try {
        const {
            customerId, productRentalIds, studioRentalIds,
            items, subtotal, tax, totalAmount,
            paymentMethod, paymentStatus, notes
        } = req.body;
        if (!customerId || !items?.length || !paymentMethod) {
            return res.status(400).json({ message: 'customerId, items and paymentMethod are required' });
        }
        const invoice = await Invoice.create({
            customer: customerId,
            productRentals: productRentalIds || [],
            studioRentals:  studioRentalIds  || [],
            items,
            subtotal: subtotal || 0,
            tax: tax || 0,
            totalAmount: totalAmount || 0,
            paymentMethod,
            paymentStatus,
            createdBy: req.user._id,
            notes
        });
        const populated = await Invoice.findById(invoice._id)
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId')
            .populate('createdBy', 'name');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/invoices/:id/payment
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true, runValidators: true }
        ).populate('customer', 'firstName lastName');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Sync rental payment statuses if this invoice is linked to any
        if (paymentStatus === 'Paid') {
            if (invoice.studioRentals?.length > 0) {
                await StudioRental.updateMany(
                    { _id: { $in: invoice.studioRentals } },
                    { paymentStatus: 'Paid' }
                );
            }
            if (invoice.productRentals?.length > 0) {
                await ProductRental.updateMany(
                    { _id: { $in: invoice.productRentals } },
                    { paymentStatus: 'Paid' }
                );
            }
        }

        res.json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
