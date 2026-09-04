import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validation/common';
import {
    createStudioRentalSchema,
    updateStudioRentalSchema,
    studioStatusSchema,
    availabilityQuery,
    rentalListQuery,
} from '../validation/schemas';
import {
    getAllStudioRentals,
    getStudioRentalById,
    createStudioRental,
    updateStudioRental,
    updateStudioStatus,
    archiveStudioRental,
    restoreStudioRental,
    deleteStudioRental,
    getArchivedStudioRentals,
    getRoomAvailability,
} from '../controllers/studioRentalController';

const router: Router = express.Router();

router.use(protect);

router.get('/', validate({ query: rentalListQuery }), getAllStudioRentals);
router.get('/archived', adminOnly, validate({ query: paginationQuery }), getArchivedStudioRentals);
router.get('/availability', validate({ query: availabilityQuery }), getRoomAvailability);
router.get('/:id', validate({ params: idParam }), getStudioRentalById);

router.post('/', validate({ body: createStudioRentalSchema }), createStudioRental);
router.patch('/:id', validate({ params: idParam, body: updateStudioRentalSchema }), updateStudioRental);
router.patch('/:id/status', validate({ params: idParam, body: studioStatusSchema }), updateStudioStatus);
router.patch('/:id/archive', validate({ params: idParam }), archiveStudioRental);
router.patch('/:id/restore', adminOnly, validate({ params: idParam }), restoreStudioRental);
router.delete('/:id', adminOnly, validate({ params: idParam }), deleteStudioRental);

export default router;
