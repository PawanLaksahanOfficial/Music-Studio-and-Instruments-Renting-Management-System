const mongoose = require('mongoose');
const Customers = require('../models/Customer')

exports.getAllCustomers = async (req, res) => {
    try {        
        const customers = await Customers.find()         
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};