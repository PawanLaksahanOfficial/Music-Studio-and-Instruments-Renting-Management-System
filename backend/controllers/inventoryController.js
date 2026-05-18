const { v4: uuidv4 } = require('uuid');
const Inventory = require('../models/Inventory');

// GET /api/inventory
exports.getAllInventoryRecords = async (req, res) => {
    try {
        const items = await Inventory.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/inventory/qr/:qrCodeId
exports.getByQRCode = async (req, res) => {
    try {
        const rawParam   = decodeURIComponent(req.params.qrCodeId);
        const qrCodeId   = rawParam.split('|')[0].trim();

        const item = await Inventory.findOne({ qrCodeId });
        if (!item) return res.status(404).json({ message: 'No item found for this QR code' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/inventory/:id
exports.getInventoryById = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/inventory
exports.createInventoryItem = async (req, res) => {
    try {
        const { itemName, category, brand, model, serialNumber, status, baseRentalPrice, purchaseDate } = req.body;
        if (!itemName || !category || !serialNumber || baseRentalPrice === undefined) {
            return res.status(400).json({ message: 'itemName, category, serialNumber and baseRentalPrice are required' });
        }
        const existing = await Inventory.findOne({ serialNumber });
        if (existing) return res.status(409).json({ message: 'An item with this serial number already exists' });

        const qrCodeId = `ELVI-${uuidv4().split('-')[0].toUpperCase()}`;
        const item = await Inventory.create({
            itemName, category, brand, model, serialNumber,
            qrCodeId, status, baseRentalPrice, purchaseDate,
        });
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// PATCH /api/inventory/:id
exports.updateInventoryItem = async (req, res) => {
    try {
        const allowed = ['itemName','category','brand','model','serialNumber','status','baseRentalPrice','purchaseDate','lastMaintenance'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const item = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/inventory/:id
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        if (item.status === 'Rented') {
            return res.status(400).json({ message: 'Cannot delete an item that is currently rented out' });
        }
        await item.deleteOne();
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};