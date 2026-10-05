import { RequestHandler } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { corsOrigins, env } from '../config/env';
import { badRequest, forbidden } from '../utils/AppError';

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            // React/Radix/Recharts set inline style attributes for positioning.
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'blob:'],
            'media-src': ["'self'", 'blob:'],
            'font-src': ["'self'", 'data:'],
            'connect-src': ["'self'"],
            'object-src': ["'none'"],
            'frame-ancestors': ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/** Only this origin may use the camera (QR scanning); everything else is disabled. */
export const permissionsPolicy: RequestHandler = (_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()');
    next();
};

const corsOptions: CorsOptions = {
    origin: (origin, callback) => callback(null, !origin || corsOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);

const rateLimitMessage = { message: 'Too many requests. Please wait a few minutes and try again.', code: 'RATE_LIMITED' };

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: rateLimitMessage,
});

/** Caps login attempts per client IP, whatever username is tried. */
export const loginIpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: rateLimitMessage,
});

/** Caps failed logins for one username from one IP (brute-force protection). */
export const loginAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: req => {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase().slice(0, 64) : '';
        return `${ipKeyGenerator(req.ip ?? '')}|${username}`;
    },
    message: rateLimitMessage,
});

/**
 * CSRF defence in depth: browsers only let same-origin scripts (or CORS-approved origins, after a
 * preflight) set custom headers. Combined with SameSite=Strict cookies, cross-site forms are rejected.
 */
export const requireAjaxHeader: RequestHandler = (req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    if (req.get('x-requested-with') !== 'XMLHttpRequest') throw forbidden('Missing X-Requested-With header', 'CSRF_REJECTED');
    next();
};

const hasOperatorKey = (value: unknown, depth = 0): boolean => {
    if (depth > 10 || value === null || typeof value !== 'object') return false;
    return Object.entries(value as Record<string, unknown>).some(
        ([key, child]) => key.startsWith('$') || key.includes('.') || key === '__proto__' || hasOperatorKey(child, depth + 1),
    );
};

/**
 * Rejects MongoDB operator keys ("$ne", "$gt", dotted paths, "__proto__") anywhere in the input.
 * Route-level zod validation is the primary defence; this blocks NoSQL injection globally.
 */
export const rejectMongoOperators: RequestHandler = (req, _res, next) => {
    if (hasOperatorKey(req.body) || hasOperatorKey(req.query)) throw badRequest('Request contains forbidden characters in field names');
    next();
};

export const parseTrustProxy = (value: string): boolean | number | string => {
    if (value === 'true') return true;
    if (value === 'false' || value === '') return false;
    const hops = Number(value);
    return Number.isInteger(hops) ? hops : value;
};
