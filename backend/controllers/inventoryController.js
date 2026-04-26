const mongoose = require('mongoose');
const Inventories = require('../models/Inventory')

exports.getAllInventoryRecords = async (req, res) => {
    try {        
        const inventories = await Inventories.find()         
        res.status(200).json(inventories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};