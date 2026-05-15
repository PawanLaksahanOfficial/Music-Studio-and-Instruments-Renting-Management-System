const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const {
    getAllInventoryRecords, getByQRCode, getInventoryById,
    createInventoryItem, updateInventoryItem, deleteInventoryItem
} = require('../controllers/inventoryController');

router.use(protect);

router.get('/qr/:qrCodeId', getByQRCode);
router.get('/', getAllInventoryRecords);
router.get('/:id', getInventoryById);
router.post('/', adminOnly, createInventoryItem);
router.patch('/:id', adminOnly, updateInventoryItem);
router.delete('/:id', adminOnly, deleteInventoryItem);

module.exports = router;