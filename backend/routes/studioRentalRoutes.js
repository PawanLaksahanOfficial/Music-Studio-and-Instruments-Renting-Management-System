const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../auth');
const { getAllStudioRentals, getStudioRentalById, createStudioRental, updateStudioRental, updateStudioStatus, deleteStudioRental } = require('../controllers/studioRentalController');

router.use(protect);
router.get('/', getAllStudioRentals);
router.get('/:id', getStudioRentalById);
router.post('/', createStudioRental);
router.patch('/:id', updateStudioRental);
router.patch('/:id/status', updateStudioStatus);
router.delete('/:id', adminOnly, deleteStudioRental);

module.exports = router;