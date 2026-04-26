const express = require('express');
const router = express.Router();
const { 
    getAllCustomers
} = require('../controllers/customerController');

// GET /api/customers
router.get('/', getAllCustomers);

module.exports = router;