import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { getAllStudioRentals, getStudioRentalById, createStudioRental, updateStudioRental, updateStudioStatus, deleteStudioRental } from '../controllers/studioRentalController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/', getAllStudioRentals);
router.get('/:id', getStudioRentalById);
router.post('/', createStudioRental);
router.patch('/:id', updateStudioRental);
router.patch('/:id/status', updateStudioStatus);
router.delete('/:id', adminOnly as any, deleteStudioRental);

export default router;
