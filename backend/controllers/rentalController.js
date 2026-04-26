const mongoose = require('mongoose');
const Rental = require('../models/ProductRental');
const Inventory = require('../models/Inventory');

exports.getAllRentals = async (req, res) => {
    try {        
        const rentals = await Rental.find({ isDeleted: false })
            .populate('customer')
            .populate('items.itemId');            
        res.status(200).json(rentals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createNewRental = async (req, res) => {
    try {
        const { customerId, items, dueDate, totalAmount } = req.body;
        const newRental = new Rental({
            customer: customerId,
            items,
            dueDate,
            totalAmount
        });
        const savedRental = await newRental.save();
        const itemIds = items.map(i => i.itemId);
        await Inventory.updateMany(
            { _id: { $in: itemIds } },
            { $set: { status: 'Rented' } }
        );
        res.status(201).json(savedRental);
    } catch (error) {
        res.status(400).json({ message: "Rental creation failed", error: error.message });
    }
};

exports.updateRentalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedRental = await Rental.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json(updatedRental);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRental = async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findById(id);       
        if (!rental) {
            return res.status(404).json({ message: "Rental not found" });
        }
        rental.isDeleted = true;
        await rental.save();
        // Update Inventory Status
        const itemIds = rental.items.map(i => i.itemId);
        await Inventory.updateMany(
            { _id: { $in: itemIds } },
            { $set: { status: 'Available' } }
        );
        res.status(200).json({ message: "Rental deleted and items returned to inventory" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};