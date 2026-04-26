const express = require('express');
const router = express.Router();
const { 
    getAllInventoryRecords
} = require('../controllers/inventoryController');

// GET /api/inventory
router.get('/', getAllInventoryRecords);

module.exports = router;