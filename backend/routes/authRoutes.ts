import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe, changePassword, completePasswordSetup } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, changePasswordSchema, completeSetupSchema } from '../validation/schemas';
import { env } from '../config/env';

const router: Router = express.Router();

/**
 * Credential endpoints are the ones worth brute-forcing, so they get a much
 * tighter budget than the rest of the API. Successful logins are not counted,
 * so a busy till does not lock itself out.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isProduction ? 10 : 100,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/set-password', authLimiter, validate({ body: completeSetupSchema }), completePasswordSetup);
router.get('/me', protect, getMe);
router.post('/change-password', protect, validate({ body: changePasswordSchema }), changePassword);

export default router;
