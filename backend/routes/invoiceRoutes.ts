import express, { Router } from 'express';
import { protect } from '../auth';
import { getAllInvoices, getInvoiceById, createInvoice, updatePaymentStatus } from '../controllers/invoiceController';

const router: Router = express.Router();

router.use(protect as any);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/payment', updatePaymentStatus);

export default router;
