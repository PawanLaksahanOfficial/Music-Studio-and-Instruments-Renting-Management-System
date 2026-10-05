import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createInvoiceBody, invoicePaymentBody } from '../validators/invoice';
import { createInvoice, getInvoice, listInvoices, updateInvoicePayment } from '../controllers/invoiceController';

const router = Router();

router.use(protect);
router.get('/', listInvoices);
router.get('/:id', validate({ params: idParams }), getInvoice);
router.post('/', validate({ body: createInvoiceBody }), createInvoice);
router.patch('/:id/payment', validate({ params: idParams, body: invoicePaymentBody }), updateInvoicePayment);

export default router;
