import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
    level: env.isTest ? 'silent' : env.isProduction ? 'info' : 'debug',
    // Pretty output in development; production emits JSON for log aggregators.
    transport: env.isProduction || env.isTest
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.newPassword',
            'req.body.currentPassword',
            '*.password',
        ],
        censor: '[redacted]',
    },
});
