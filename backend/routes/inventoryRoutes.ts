import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import {
    getAllInventoryRecords, getByQRCode, getInventoryById,
    createInventoryItem, updateInventoryItem, deleteInventoryItem
} from '../controllers/inventoryController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/qr/:qrCodeId', getByQRCode);
router.get('/', getAllInventoryRecords);
router.get('/:id', getInventoryById);
router.post('/', adminOnly as any, createInventoryItem);
router.patch('/:id', adminOnly as any, updateInventoryItem);
router.delete('/:id', adminOnly as any, deleteInventoryItem);

export default router;
