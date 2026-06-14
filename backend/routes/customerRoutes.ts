import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, toggleBlacklist, deleteCustomer} from '../controllers/customerController';

const router: Router = express.Router();

router.use(protect);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', adminOnly, createCustomer);
router.patch('/:id', adminOnly, updateCustomer);
router.patch('/:id/blacklist', adminOnly, toggleBlacklist);
router.delete('/:id', adminOnly,  deleteCustomer);

export default router;
