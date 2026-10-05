import path from 'node:path';
import fs from 'node:fs';
import express, { Express } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { isDbReady } from './config/db';
import { httpLogger } from './utils/logger';
import {
    apiLimiter, corsMiddleware, parseTrustProxy, permissionsPolicy, rejectMongoOperators,
    requireAjaxHeader, securityHeaders,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import rentalRoutes from './routes/rentalRoutes';
import studioRentalRoutes from './routes/studioRentalRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import statsRoutes from './routes/statsRoutes';
import cronRoutes from './routes/cronRoutes';

export const createApp = (): Express => {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', parseTrustProxy(env.TRUST_PROXY));
    app.use(httpLogger);
    app.use(securityHeaders);
    app.use(permissionsPolicy);
    app.use(compression());
    app.get('/healthz', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.get('/readyz', (_req, res) => {
        const ready = isDbReady();
        res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable', database: ready });
    });

    const api = express.Router();
    api.use(corsMiddleware);
    api.use(express.json({ limit: '100kb' }));
    api.use(cookieParser());
    api.use(apiLimiter);
    api.use(requireAjaxHeader);
    api.use(rejectMongoOperators);

    api.use('/auth', authRoutes);
    api.use('/users', userRoutes);
    api.use('/customers', customerRoutes);
    api.use('/inventory', inventoryRoutes);
    api.use('/rentals', rentalRoutes);
    api.use('/studio-rentals', studioRentalRoutes);
    api.use('/invoices', invoiceRoutes);
    api.use('/stats', statsRoutes);
    api.use('/cron', cronRoutes);
    api.use(notFoundHandler);

    app.use('/api', api);

    const clientDist = path.resolve(__dirname, env.CLIENT_DIST);
    if (env.SERVE_CLIENT && fs.existsSync(path.join(clientDist, 'index.html'))) {
        app.use(express.static(clientDist, {
            index: false,
            setHeaders: (res, filePath) => {
                // Vite emits content-hashed files under /assets, so they can be cached forever.
                if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            },
        }));
        app.get('/{*splat}', (_req, res) => {
            res.setHeader('Cache-Control', 'no-cache');
            res.sendFile(path.join(clientDist, 'index.html'));
        });
    } else {
        app.get('/', (_req, res) => {
            res.json({ name: 'ELVI Music Studio API', status: 'ok' });
        });
    }

    app.use(errorHandler);
    return app;
};
