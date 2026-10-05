import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import {
    createRentalBody, extendRentalBody, qrCodeParams, returnQuoteQuery, returnRentalBody, updateRentalBody,
} from '../validators/rental';
import {
    archiveRental, createRental, deleteRental, extendRental, getActiveRentalByQr, getRental, getReturnQuote,
    listArchivedRentals, listRentals, restoreRental, returnRental, updateRental,
} from '../controllers/rentalController';

const router = Router();
const withId = validate({ params: idParams });

router.use(protect);

router.get('/', listRentals);
router.get('/archived', adminOnly, listArchivedRentals);
router.get('/by-qr/:qrCodeId', validate({ params: qrCodeParams }), getActiveRentalByQr);
router.get('/:id', withId, getRental);
router.get('/:id/return-quote', validate({ params: idParams, query: returnQuoteQuery }), getReturnQuote);

router.post('/', validate({ body: createRentalBody }), createRental);
router.patch('/:id', validate({ params: idParams, body: updateRentalBody }), updateRental);
router.patch('/:id/extend', validate({ params: idParams, body: extendRentalBody }), extendRental);
router.post('/:id/return', validate({ params: idParams, body: returnRentalBody }), returnRental);
router.patch('/:id/archive', withId, archiveRental);
router.patch('/:id/restore', adminOnly, withId, restoreRental);
router.delete('/:id', adminOnly, withId, deleteRental);

export default router;
