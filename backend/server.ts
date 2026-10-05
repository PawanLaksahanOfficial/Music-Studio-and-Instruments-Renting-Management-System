// Load and validate configuration before anything else reads process.env.
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { createApp } from './app';
import { initCronJobs } from './utils/cronJobs';
import { logger } from './utils/logger';

process.on('unhandledRejection', reason => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', err => {
    logger.fatal({ err }, 'Uncaught exception, shutting down');
    process.exit(1);
});

const start = async () => {
    // Connect before accepting traffic, so the first requests don't fail.
    await connectDB();

    const app = createApp();
    const server = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT, env: env.NODE_ENV }, 'ELVI Music Studio API listening');
    });

    const stopCron = env.CRON_ENABLED ? initCronJobs() : () => undefined;

    let shuttingDown = false;
    const shutdown = (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info({ signal }, 'Shutting down gracefully');
        stopCron();

        // Force exit if open connections don't drain in time.
        const forceExit = setTimeout(() => process.exit(1), 10_000);
        forceExit.unref();

        server.close(async () => {
            await disconnectDB().catch(err => logger.error({ err }, 'Error closing MongoDB connection'));
            logger.info('Shutdown complete');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch(err => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
