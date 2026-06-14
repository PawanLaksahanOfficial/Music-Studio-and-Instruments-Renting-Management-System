import express, { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { protect } from '../auth';

const router: Router = express.Router();

router.post('/login', login);
router.get('/me', protect as any, getMe);

export default router;
