import express, { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam } from '../validation/common';
import { createInvoiceSchema, invoicePaymentSchema, invoiceListQuery } from '../validation/schemas';
import {
    getAllInvoices,
    getInvoiceById,
    createInvoice,
    updatePaymentStatus,
    getBillableForCustomer,
} from '../controllers/invoiceController';

const router: Router = express.Router();

router.use(protect);

router.get('/', validate({ query: invoiceListQuery }), getAllInvoices);
router.get('/billable/:customerId', getBillableForCustomer);
router.get('/:id', validate({ params: idParam }), getInvoiceById);
router.post('/', validate({ body: createInvoiceSchema }), createInvoice);
router.patch('/:id/payment', validate({ params: idParam, body: invoicePaymentSchema }), updatePaymentStatus);

export default router;
