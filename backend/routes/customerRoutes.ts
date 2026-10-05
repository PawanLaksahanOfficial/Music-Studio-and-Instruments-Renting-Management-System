import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createCustomerBody, updateCustomerBody } from '../validators/customer';
import {
    archiveCustomer, createCustomer, deleteCustomer, getCustomer, getCustomerProfile,
    listArchivedCustomers, listCustomers, restoreCustomer, toggleBlacklist, updateCustomer,
} from '../controllers/customerController';

const router = Router();
const withId = validate({ params: idParams });

router.use(protect);

// Readable by all staff (cashiers pick customers when creating rentals).
router.get('/', listCustomers);
router.get('/archived', adminOnly, listArchivedCustomers);
router.get('/:id/profile', withId, getCustomerProfile);
router.get('/:id', withId, getCustomer);

// Customer management is admin-only.
router.post('/', adminOnly, validate({ body: createCustomerBody }), createCustomer);
router.patch('/:id', adminOnly, validate({ params: idParams, body: updateCustomerBody }), updateCustomer);
router.patch('/:id/blacklist', adminOnly, withId, toggleBlacklist);
router.patch('/:id/archive', adminOnly, withId, archiveCustomer);
router.patch('/:id/restore', adminOnly, withId, restoreCustomer);
router.delete('/:id', adminOnly, withId, deleteCustomer);

export default router;
