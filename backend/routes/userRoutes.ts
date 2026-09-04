import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam } from '../validation/common';
import { createUserSchema, updateUserSchema, sendSetupLinkSchema } from '../validation/schemas';
import {
    getAllUsers,
    createUser,
    updateUser,
    toggleActive,
    deleteUser,
    sendSetupLink,
} from '../controllers/userController';

const router: Router = express.Router();

router.use(protect, adminOnly);

router.get('/', getAllUsers);
router.post('/', validate({ body: createUserSchema }), createUser);
router.post('/send-setup-link', validate({ body: sendSetupLinkSchema }), sendSetupLink);
router.patch('/:id', validate({ params: idParam, body: updateUserSchema }), updateUser);
router.patch('/:id/toggle-active', validate({ params: idParam }), toggleActive);
router.delete('/:id', validate({ params: idParam }), deleteUser);

export default router;
