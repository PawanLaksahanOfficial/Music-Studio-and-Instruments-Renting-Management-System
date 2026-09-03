import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { 
    getAllStudioRentals, getStudioRentalById, createStudioRental, 
    updateStudioRental, updateStudioStatus, archiveStudioRental, 
    restoreStudioRental, deleteStudioRental, getArchivedStudioRentals 
} from '../controllers/studioRentalController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/', getAllStudioRentals);
router.get('/archived', adminOnly as any, getArchivedStudioRentals);
router.get('/:id', getStudioRentalById);
router.post('/', createStudioRental);
router.patch('/:id', updateStudioRental);
router.patch('/:id/status', updateStudioStatus);
router.patch('/:id/archive', archiveStudioRental);
router.patch('/:id/restore', adminOnly as any, restoreStudioRental);
router.delete('/:id', adminOnly as any, deleteStudioRental);

export default router;