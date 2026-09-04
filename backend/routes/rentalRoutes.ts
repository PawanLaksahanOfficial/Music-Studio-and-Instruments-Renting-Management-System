import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validation/common';
import {
    createRentalSchema,
    quoteRentalSchema,
    extendRentalSchema,
    rentalStatusSchema,
    rentalPaymentSchema,
    processReturnSchema,
    rentalListQuery,
} from '../validation/schemas';
import {
    getAllRentals,
    getRentalById,
    createNewRental,
    quoteRental,
    updateRentalStatus,
    extendDueDate,
    updatePaymentStatus,
    archiveRental,
    restoreRental,
    deleteRental,
    getArchivedRentals,
    getRentalByQR,
    processReturn,
} from '../controllers/rentalController';

const router: Router = express.Router();

router.use(protect);

// Static paths are registered before '/:id' so they are not captured by it.
router.get('/', validate({ query: rentalListQuery }), getAllRentals);
router.get('/archived', adminOnly, validate({ query: paginationQuery }), getArchivedRentals);
router.get('/by-qr/:qrCodeId', getRentalByQR);
router.post('/quote', validate({ body: quoteRentalSchema }), quoteRental);
router.post('/process-return', validate({ body: processReturnSchema }), processReturn);
router.post('/', validate({ body: createRentalSchema }), createNewRental);

router.get('/:id', validate({ params: idParam }), getRentalById);
router.patch('/:id/status', validate({ params: idParam, body: rentalStatusSchema }), updateRentalStatus);
router.patch('/:id/extend', validate({ params: idParam, body: extendRentalSchema }), extendDueDate);
router.patch('/:id/payment', validate({ params: idParam, body: rentalPaymentSchema }), updatePaymentStatus);
router.patch('/:id/archive', validate({ params: idParam }), archiveRental);
router.patch('/:id/restore', adminOnly, validate({ params: idParam }), restoreRental);
router.delete('/:id', adminOnly, validate({ params: idParam }), deleteRental);

export default router;
