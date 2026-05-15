const Customer = require('../models/Customer');

// GET /api/customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('rentalHistory');
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/customers
exports.createCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, nicOrPassport } = req.body;
        if (!firstName || !lastName || !phone || !nicOrPassport) {
            return res.status(400).json({ message: 'firstName, lastName, phone and nicOrPassport are required' });
        }
        const existing = await Customer.findOne({ nicOrPassport });
        if (existing) return res.status(409).json({ message: 'A customer with this NIC/Passport already exists' });

        const customer = await Customer.create({ firstName, lastName, email, phone, address, nicOrPassport });
        res.status(201).json(customer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/customers/:id
exports.updateCustomer = async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'email', 'phone', 'address', 'nicOrPassport'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const customer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/customers/:id/blacklist
exports.toggleBlacklist = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        customer.isBlacklisted = !customer.isBlacklisted;
        await customer.save();
        res.json({ isBlacklisted: customer.isBlacklisted });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};