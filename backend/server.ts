import { env } from './config/env';
import { logger } from './utils/logger';
import connectDB from './config/db';
import { createApp } from './app';
import { initCronJobs } from './utils/cronJobs';

const start = async () => {
    await connectDB();

    const app = createApp();
    const server = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, '🎵 ELVI Music Studio API is running');
        initCronJobs();
    });

    // Finish in-flight requests before exiting so a deploy or scale-in does
    // not sever a checkout mid-transaction.
    const shutdown = (signal: string) => {
        logger.info({ signal }, 'Shutting down');
        server.close(async () => {
            const mongoose = await import('mongoose');
            await mongoose.default.connection.close();
            logger.info('Shutdown complete');
            process.exit(0);
        });
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    process.exit(1);
});

start().catch(err => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
