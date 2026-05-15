const ProductRental = require('../models/ProductRental');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// GET /api/rentals
exports.getAllRentals = async (req, res) => {
    try {
        const rentals = await ProductRental.find({ isDeleted: false })
            .populate('customer')
            .populate('items.itemId')
            .sort({ createdAt: -1 });
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/rentals/:id
exports.getRentalById = async (req, res) => {
    try {
        const rental = await ProductRental.findOne({ _id: req.params.id, isDeleted: false })
            .populate('customer')
            .populate('items.itemId');
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        res.json(rental);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/rentals
exports.createNewRental = async (req, res) => {
    try {
        const { customerId, items, dueDate, totalAmount, paymentStatus, notes } = req.body;
        if (!customerId || !items?.length || !dueDate || totalAmount === undefined) {
            return res.status(400).json({ message: 'customerId, items, dueDate and totalAmount are required' });
        }
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        if (customer.isBlacklisted) return res.status(403).json({ message: 'Customer is blacklisted and cannot rent items' });
        const itemIds = items.map(i => i.itemId);
        const inventoryItems = await Inventory.find({ _id: { $in: itemIds } });
        const notAvailable = inventoryItems.filter(i => i.status !== 'Available');
        if (notAvailable.length > 0) {
            return res.status(400).json({
                message: `The following items are not available: ${notAvailable.map(i => i.itemName).join(', ')}`
            });
        }

        const rental = await ProductRental.create({
            customer: customerId, items, dueDate, totalAmount, paymentStatus, notes
        });
        await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Rented' } });
        await Customer.findByIdAndUpdate(customerId, { $push: { rentalHistory: rental._id } });
        const populated = await ProductRental.findById(rental._id)
            .populate('customer').populate('items.itemId');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/status
exports.updateRentalStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const rental = await ProductRental.findOne({ _id: req.params.id, isDeleted: false });
        if (!rental) return res.status(404).json({ message: 'Rental not found' });

        rental.status = status;
        if (status === 'Returned') rental.returnDate = new Date();
        await rental.save();
        if (status === 'Returned') {
            const itemIds = rental.items.map(i => i.itemId);
            await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Available' } });
        }
        res.json(rental);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/extend  — extend due date
exports.extendDueDate = async (req, res) => {
    try {
        const { newDueDate } = req.body;
        if (!newDueDate) return res.status(400).json({ message: 'newDueDate is required' });
        const rental = await ProductRental.findOne({ _id: req.params.id, isDeleted: false });
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        if (rental.status === 'Returned') return res.status(400).json({ message: 'Cannot extend a returned rental' });
        rental.dueDate = new Date(newDueDate);
        if (rental.status === 'Overdue') rental.status = 'Rented';
        await rental.save();
        res.json(rental);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/payment
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const rental = await ProductRental.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { paymentStatus },
            { new: true, runValidators: true }
        );
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        res.json(rental);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/rentals/:id  — soft delete
exports.deleteRental = async (req, res) => {
    try {
        const rental = await ProductRental.findOne({ _id: req.params.id, isDeleted: false });
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        rental.isDeleted = true;
        await rental.save();
        if (rental.status !== 'Returned') {
            const itemIds = rental.items.map(i => i.itemId);
            await Inventory.updateMany({ _id: { $in: itemIds } }, { $set: { status: 'Available' } });
        }
        res.json({ message: 'Rental deleted and items returned to inventory' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};