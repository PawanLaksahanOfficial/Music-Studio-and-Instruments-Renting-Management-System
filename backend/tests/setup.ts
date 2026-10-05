import { inject } from 'vitest';

// Runs before each test file is imported, so config/env sees these values.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = inject('mongoUri');
process.env.JWT_SECRET = 'test-only-secret-that-is-definitely-long-enough-0123456789';
process.env.CRON_ENABLED = 'false';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.APP_TIMEZONE = 'Asia/Colombo';
delete process.env.AWS_SES_FROM_EMAIL;
