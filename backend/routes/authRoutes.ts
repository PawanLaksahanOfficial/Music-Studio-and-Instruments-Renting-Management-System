import { Router } from 'express';
import { changePassword, getMe, login, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginAccountLimiter, loginIpLimiter } from '../middleware/security';
import { changePasswordBody, loginBody } from '../validators/auth';

const router = Router();

router.post('/login', loginIpLimiter, loginAccountLimiter, validate({ body: loginBody }), login);
router.post('/logout', logout);
// `authenticate` (not `protect`) so users who must change their password can still reach these.
router.get('/me', authenticate, getMe);
router.patch('/password', authenticate, validate({ body: changePasswordBody }), changePassword);

export default router;
