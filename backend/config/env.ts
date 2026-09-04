import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment is validated once, at boot. A missing or malformed variable
 * fails the process immediately with a readable message instead of surfacing
 * as an `undefined` deep inside a request months later.
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters — generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'),
    JWT_EXPIRES_IN: z.string().default('8h'),

    CORS_ORIGINS: z.string().default('http://localhost:5173'),

    AZURE_COMMUNICATION_CONNECTION_STRING: z.string().optional(),
    AZURE_EMAIL_SENDER_ADDRESS: z.string().optional(),
    AZURE_SMS_FROM_NUMBER: z.string().optional(),

    ENABLE_CRON: z
        .string()
        .default('true')
        .transform(v => v.toLowerCase() === 'true'),
    REMINDER_CRON: z.string().default('0 9 * * *'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map(i => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
    console.error(`\n❌ Invalid environment configuration:\n${issues}\n\nSee backend/.env.example for the full list.\n`);
    process.exit(1);
}

export const env = {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',')
        .map(o => o.trim())
        .filter(Boolean),
    isProduction: parsed.data.NODE_ENV === 'production',
    isTest: parsed.data.NODE_ENV === 'test',
};

export type Env = typeof env;
