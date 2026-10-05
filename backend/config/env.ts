// Import this module first so every other module sees the loaded .env values.
import dotenv from 'dotenv';
import { z } from 'zod';

// Tests configure the environment explicitly and must never pick up a developer's real .env.
if (process.env.NODE_ENV !== 'test') dotenv.config({ quiet: true });

const optionalString = z
    .string()
    .optional()
    .transform(v => (v && v.trim() !== '' ? v.trim() : undefined));

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters (use: openssl rand -base64 48)'),
    JWT_EXPIRES_IN: z.string().default('8h'),

    // Comma separated list of browser origins allowed to call the API with credentials.
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    // Express "trust proxy" setting: number of hops, "true" or "false". Required for correct client IPs behind a load balancer.
    TRUST_PROXY: z.string().default('false'),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    APP_TIMEZONE: z.string().default('Asia/Colombo'),
    DEFAULT_COUNTRY_CODE: z.string().regex(/^\d{1,3}$/).default('94'),

    CRON_ENABLED: z.stringbool().default(true),
    // Serve the built frontend (../frontend/dist) from this server for a same-origin production deploy.
    SERVE_CLIENT: z.stringbool().default(false),
    CLIENT_DIST: z.string().default('../frontend/dist'),

    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: optionalString,
    AWS_SECRET_ACCESS_KEY: optionalString,
    AWS_SES_FROM_EMAIL: optionalString,
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    // The logger depends on env, so report configuration problems directly.
    console.error(`\n❌ Invalid environment configuration:\n${z.prettifyError(parsed.error)}\n`);
    process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
