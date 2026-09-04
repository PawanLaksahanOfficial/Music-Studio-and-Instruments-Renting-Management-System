import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam, paginationQuery } from '../validation/common';
import { createCustomerSchema, updateCustomerSchema } from '../validation/schemas';
import {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    toggleBlacklist,
    archiveCustomer,
    restoreCustomer,
    deleteCustomer,
    getArchivedCustomers,
    getCustomerProfile,
} from '../controllers/customerController';

const router: Router = express.Router();

router.use(protect);

router.get('/', validate({ query: paginationQuery }), getAllCustomers);
router.get('/archived', adminOnly, validate({ query: paginationQuery }), getArchivedCustomers);
router.get('/:id/profile', validate({ params: idParam }), getCustomerProfile);
router.get('/:id', validate({ params: idParam }), getCustomerById);

router.post('/', adminOnly, validate({ body: createCustomerSchema }), createCustomer);
router.patch('/:id', adminOnly, validate({ params: idParam, body: updateCustomerSchema }), updateCustomer);
router.patch('/:id/blacklist', adminOnly, validate({ params: idParam }), toggleBlacklist);
router.patch('/:id/archive', validate({ params: idParam }), archiveCustomer);
router.patch('/:id/restore', adminOnly, validate({ params: idParam }), restoreCustomer);
router.delete('/:id', adminOnly, validate({ params: idParam }), deleteCustomer);

export default router;
