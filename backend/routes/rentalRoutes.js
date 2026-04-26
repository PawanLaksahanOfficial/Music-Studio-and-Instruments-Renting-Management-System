const express = require('express');
const router = express.Router();
const { 
    getAllRentals, 
    createNewRental, 
    updateRentalStatus,
    deleteRental 
} = require('../controllers/rentalController');

// GET /api/rentals
router.get('/', getAllRentals);

// POST /api/rentals
router.post('/', createNewRental);

// PATCH /api/rentals/:id
router.patch('/:id/status', updateRentalStatus);

// PATCH /api/:id
router.patch('/:id', deleteRental)

module.exports = router;