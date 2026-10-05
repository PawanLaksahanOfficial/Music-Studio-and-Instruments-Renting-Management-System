import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createStudioBody, updateStudioBody } from '../validators/studio';
import {
    archiveStudioRental, createStudioRental, deleteStudioRental, getStudioRental, listArchivedStudioRentals,
    listRooms, listStudioRentals, restoreStudioRental, updateStudioRental,
} from '../controllers/studioRentalController';

const router = Router();
const withId = validate({ params: idParams });

router.use(protect);

router.get('/', listStudioRentals);
router.get('/rooms', listRooms);
router.get('/archived', adminOnly, listArchivedStudioRentals);
router.get('/:id', withId, getStudioRental);

router.post('/', validate({ body: createStudioBody }), createStudioRental);
router.patch('/:id', validate({ params: idParams, body: updateStudioBody }), updateStudioRental);
router.patch('/:id/archive', withId, archiveStudioRental);
router.patch('/:id/restore', adminOnly, withId, restoreStudioRental);
router.delete('/:id', adminOnly, withId, deleteStudioRental);

export default router;
