import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { 
    getAllRentals, getRentalById, createNewRental, updateRentalStatus, 
    extendDueDate, updatePaymentStatus, archiveRental, restoreRental, deleteRental,
    getArchivedRentals, getRentalByQR, processReturn 
} from '../controllers/rentalController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/', getAllRentals);
router.get('/archived', adminOnly as any, getArchivedRentals);
router.get('/by-qr/:qrCodeId', getRentalByQR);
router.post('/process-return', processReturn);
router.get('/:id', getRentalById);
router.post('/', createNewRental);
router.patch('/:id/status', updateRentalStatus);
router.patch('/:id/extend', extendDueDate);
router.patch('/:id/payment', updatePaymentStatus);
router.patch('/:id/archive', archiveRental);
router.patch('/:id/restore', adminOnly as any, restoreRental);
router.delete('/:id', adminOnly as any, deleteRental);

export default router;