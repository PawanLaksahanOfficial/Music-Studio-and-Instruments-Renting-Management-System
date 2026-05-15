const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const { getAllRentals, getRentalById, createNewRental, updateRentalStatus, extendDueDate, updatePaymentStatus, deleteRental } = require('../controllers/rentalController');

router.use(protect);
router.get('/', getAllRentals);
router.get('/:id', getRentalById);
router.post('/', createNewRental);
router.patch('/:id/status', updateRentalStatus);
router.patch('/:id/extend', extendDueDate);
router.patch('/:id/payment', updatePaymentStatus);
router.delete('/:id', adminOnly, deleteRental);

module.exports = router;