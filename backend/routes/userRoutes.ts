import express, { Router } from 'express';
import { protect, adminOnly } from '../auth';
import { getAllUsers, createUser, updateUser, toggleActive, deleteUser, shareCredentials } from '../controllers/userController';

const router: Router = express.Router();

router.use(protect as any, adminOnly as any);
router.get('/', getAllUsers);
router.post('/', createUser);
router.post('/share-credentials', shareCredentials);
router.patch('/:id', updateUser);
router.patch('/:id/toggle-active', toggleActive);
router.delete('/:id', deleteUser);

export default router;
