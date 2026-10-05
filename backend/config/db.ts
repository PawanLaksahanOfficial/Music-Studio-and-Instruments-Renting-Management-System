import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

mongoose.set('strictQuery', true);
// Operations inside connection.transaction() automatically join the transaction's session.
mongoose.set('transactionAsyncLocalStorage', true);

let listenersAttached = false;

export const connectDB = async (uri: string = env.MONGO_URI): Promise<void> => {
    if (!listenersAttached) {
        mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
        mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
        mongoose.connection.on('error', err => logger.error({ err }, 'MongoDB connection error'));
        listenersAttached = true;
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 20,
    });
    logger.info({ host: mongoose.connection.host }, 'MongoDB connected');
};

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
};

export const isDbReady = () => mongoose.connection.readyState === 1;
