import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { getAllRentals, getRentalById, createNewRental, updateRentalStatus, extendDueDate, updatePaymentStatus, deleteRental } from '../controllers/rentalController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/', getAllRentals);
router.get('/:id', getRentalById);
router.post('/', createNewRental);
router.patch('/:id/status', updateRentalStatus);
router.patch('/:id/extend', extendDueDate);
router.patch('/:id/payment', updatePaymentStatus);
router.delete('/:id', adminOnly as any, deleteRental);

export default router;
