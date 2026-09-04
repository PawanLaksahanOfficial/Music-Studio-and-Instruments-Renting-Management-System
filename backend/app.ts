import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import mongoose from 'mongoose';

import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { forbidden } from './utils/AppError';

// Registering models here guarantees they exist before any populate() runs.
import './models/User';
import './models/Customer';
import './models/Inventory';
import './models/ProductRental';
import './models/StudioRental';
import './models/Invoice';
import './models/Room';
import './models/Counter';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import rentalRoutes from './routes/rentalRoutes';
import studioRentalRoutes from './routes/studioRentalRoutes';
import roomRoutes from './routes/roomRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import statsRoutes from './routes/statsRoutes';
import cronRoutes from './routes/cronRoutes';


export const createApp = (): Express => {
    const app = express();

    // Behind Azure Container Apps / App Service the client IP arrives in
    // X-Forwarded-For; without this the rate limiter would see one proxy IP
    // for every visitor and throttle them collectively.
    if (env.isProduction) app.set('trust proxy', 1);

    app.use(helmet());
    app.use(
        cors({
            // An explicit allowlist — the previous `cors()` accepted any origin.
            // A rejection here never reaches the browser as a readable response
            // anyway (no Access-Control-Allow-Origin header goes out), but a
            // typed AppError keeps it a quiet 403 in the logs instead of an
            // alarming, indistinguishable-from-a-real-fault 500.
            origin: (origin, callback) => {
                if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
                callback(forbidden(`Origin ${origin} is not allowed`));
            },
            credentials: true,
        })
    );
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    if (!env.isTest) {
        app.use(pinoHttp({ logger, autoLogging: { ignore: req => req.url === '/health' } }));
    }

    // Broad ceiling for the API as a whole; credential routes set their own.
    app.use(
        '/api',
        rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: env.isProduction ? 600 : 5000,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            message: { message: 'Too many requests. Please slow down.' },
        })
    );

    app.get('/health', (_req: Request, res: Response) => {
        const dbState = mongoose.connection.readyState;
        const healthy = dbState === 1;
        res.status(healthy ? 200 : 503).json({
            status: healthy ? 'ok' : 'degraded',
            database: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/rentals', rentalRoutes);
    app.use('/api/studio-rentals', studioRentalRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/invoices', invoiceRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/cron', cronRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};
