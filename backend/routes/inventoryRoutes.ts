import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createInventoryBody, qrParams, updateInventoryBody } from '../validators/inventory';
import {
    archiveInventoryItem, createInventoryItem, deleteInventoryItem, getByQrCode, getInventoryItem,
    listArchivedInventory, listDamagedInventory, listInventory, restoreInventoryItem, updateInventoryItem,
} from '../controllers/inventoryController';

const router = Router();
const withId = validate({ params: idParams });

router.use(protect);

router.get('/', listInventory);
router.get('/damaged', listDamagedInventory);
router.get('/archived', adminOnly, listArchivedInventory);
router.get('/qr/:qrCodeId', validate({ params: qrParams }), getByQrCode);
router.get('/:id', withId, getInventoryItem);

router.post('/', adminOnly, validate({ body: createInventoryBody }), createInventoryItem);
router.patch('/:id', adminOnly, validate({ params: idParams, body: updateInventoryBody }), updateInventoryItem);
router.patch('/:id/archive', adminOnly, withId, archiveInventoryItem);
router.patch('/:id/restore', adminOnly, withId, restoreInventoryItem);
router.delete('/:id', adminOnly, withId, deleteInventoryItem);

export default router;
