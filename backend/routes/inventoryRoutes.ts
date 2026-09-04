import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validation/common';
import { createInventorySchema, updateInventorySchema, inventoryListQuery } from '../validation/schemas';
import {
    getAllInventoryRecords,
    getByQRCode,
    getInventoryById,
    createInventoryItem,
    updateInventoryItem,
    markRepaired,
    archiveInventoryItem,
    restoreInventoryItem,
    deleteInventoryItem,
    getArchivedInventoryRecords,
    getDamagedInventoryRecords,
} from '../controllers/inventoryController';

const router: Router = express.Router();

router.use(protect);

router.get('/', validate({ query: inventoryListQuery }), getAllInventoryRecords);
router.get('/archived', adminOnly, validate({ query: paginationQuery }), getArchivedInventoryRecords);
router.get('/damaged', validate({ query: paginationQuery }), getDamagedInventoryRecords);
router.get('/qr/:qrCodeId', getByQRCode);
router.get('/:id', validate({ params: idParam }), getInventoryById);

router.post('/', adminOnly, validate({ body: createInventorySchema }), createInventoryItem);
router.patch('/:id', adminOnly, validate({ params: idParam, body: updateInventorySchema }), updateInventoryItem);
router.patch('/:id/repaired', adminOnly, validate({ params: idParam }), markRepaired);
router.patch('/:id/archive', adminOnly, validate({ params: idParam }), archiveInventoryItem);
router.patch('/:id/restore', adminOnly, validate({ params: idParam }), restoreInventoryItem);
router.delete('/:id', adminOnly, validate({ params: idParam }), deleteInventoryItem);

export default router;
