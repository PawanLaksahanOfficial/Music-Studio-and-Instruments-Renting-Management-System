import { Router } from 'express';
import { adminOnly, protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParams } from '../validators/common';
import { createUserBody, updateUserBody } from '../validators/user';
import { createUser, deleteUser, listUsers, sendLoginDetails, toggleActive, updateUser } from '../controllers/userController';

const router = Router();

router.use(protect, adminOnly);
router.get('/', listUsers);
router.post('/', validate({ body: createUserBody }), createUser);
router.patch('/:id', validate({ params: idParams, body: updateUserBody }), updateUser);
router.patch('/:id/toggle-active', validate({ params: idParams }), toggleActive);
router.post('/:id/send-login-details', validate({ params: idParams }), sendLoginDetails);
router.delete('/:id', validate({ params: idParams }), deleteUser);

export default router;
