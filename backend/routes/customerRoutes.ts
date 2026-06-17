import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { 
    getAllCustomers, getCustomerById, createCustomer, updateCustomer, 
    toggleBlacklist, archiveCustomer, restoreCustomer, deleteCustomer,
    getArchivedCustomers, getCustomerProfile
} from '../controllers/customerController';

const router: Router = express.Router();

router.use(protect);

router.get('/', getAllCustomers);
router.get('/archived', adminOnly, getArchivedCustomers);
router.get('/:id/profile', getCustomerProfile);
router.get('/:id', getCustomerById);
router.post('/', adminOnly, createCustomer);
router.patch('/:id', adminOnly, updateCustomer);
router.patch('/:id/blacklist', adminOnly, toggleBlacklist);
router.patch('/:id/archive', archiveCustomer);
router.patch('/:id/restore', adminOnly, restoreCustomer);
router.delete('/:id', adminOnly, deleteCustomer);

export default router;