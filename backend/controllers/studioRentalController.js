const StudioRental = require('../models/StudioRental');
const Customer = require('../models/Customer');

// GET /api/studio-rentals
exports.getAllStudioRentals = async (req, res) => {
    try {
        const rentals = await StudioRental.find({ isDeleted: false })
            .populate('customer')
            .sort({ startTime: -1 });
        res.json(rentals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/studio-rentals/:id
exports.getStudioRentalById = async (req, res) => {
    try {
        const rental = await StudioRental.findOne({ _id: req.params.id, isDeleted: false })
            .populate('customer');
        if (!rental) return res.status(404).json({ message: 'Studio rental not found' });
        res.json(rental);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/studio-rentals
exports.createStudioRental = async (req, res) => {
    try {
        const { customerId, roomName, startTime, endTime, totalAmount, paymentStatus, notes } = req.body;
        if (!customerId || !roomName || !startTime || !endTime || totalAmount === undefined) {
            return res.status(400).json({ message: 'customerId, roomName, startTime, endTime and totalAmount are required' });
        }
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        if (customer.isBlacklisted) return res.status(403).json({ message: 'Customer is blacklisted' });
        const conflict = await StudioRental.findOne({
            roomName,
            isDeleted: false,
            status: { $in: ['Confirmed'] },
            $or: [
                { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
                { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
                { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(endTime) } }
            ]
        });
        if (conflict) {
            return res.status(409).json({ message: `${roomName} is already booked during that time slot` });
        }

        const rental = await StudioRental.create({
            customer: customerId, roomName, startTime, endTime,
            totalAmount, paymentStatus, notes
        });

        const populated = await StudioRental.findById(rental._id).populate('customer');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id
exports.updateStudioRental = async (req, res) => {
    try {
        const allowed = ['roomName', 'startTime', 'endTime', 'totalAmount', 'status', 'paymentStatus', 'notes', 'customerId'];
        const updates = {};
        allowed.forEach(f => {
            if (req.body[f] !== undefined) {
                updates[f === 'customerId' ? 'customer' : f] = req.body[f];
            }
        });
        const rental = await StudioRental.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            updates,
            { new: true, runValidators: true }
        ).populate('customer');
        if (!rental) return res.status(404).json({ message: 'Studio rental not found' });
        res.json(rental);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id/status
exports.updateStudioStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const rental = await StudioRental.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { status },
            { new: true }
        );
        if (!rental) return res.status(404).json({ message: 'Studio rental not found' });
        res.json(rental);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/studio-rentals/:id
exports.deleteStudioRental = async (req, res) => {
    try {
        const rental = await StudioRental.findOne({ _id: req.params.id, isDeleted: false });
        if (!rental) return res.status(404).json({ message: 'Studio rental not found' });
        rental.isDeleted = true;
        await rental.save();
        res.json({ message: 'Studio rental deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};