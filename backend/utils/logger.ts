import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { env, isProd, isTest } from '../config/env';

export const logger = pino({
    level: isTest ? 'silent' : env.LOG_LEVEL,
    base: { service: 'elvi-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            '*.password',
            '*.currentPassword',
            '*.newPassword',
            '*.token',
        ],
        censor: '[REDACTED]',
    },
    transport: !isProd && !isTest
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' } }
        : undefined,
});

const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

export const httpLogger = pinoHttp({
    logger,
    genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
    },
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    serializers: {
        req: req => ({ id: req.id, method: req.method, url: req.url, ip: req.remoteAddress }),
        res: res => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
        ignore: req => req.url === '/healthz' || req.url === '/readyz',
    },
});

/** Masks a phone number for logs, keeping only the last three digits. */
export const maskPhone = (phone: string) => phone.replace(/\d(?=\d{3})/g, '•');

/** Masks an email for logs: "jane.doe@example.com" -> "j•••@example.com". */
export const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return domain ? `${local.charAt(0)}•••@${domain}` : '•••';
};
