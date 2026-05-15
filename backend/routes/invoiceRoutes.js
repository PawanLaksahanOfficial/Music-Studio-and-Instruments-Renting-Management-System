const express = require('express');
const router = express.Router();
const { protect } = require('../auth');
const { getAllInvoices, getInvoiceById, createInvoice, updatePaymentStatus } = require('../controllers/invoiceController');

router.use(protect);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/payment', updatePaymentStatus);

module.exports = router;