import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    // Fail fast instead of buffering queries for 10s when Mongo is unreachable.
    mongoose.set('bufferCommands', false);
    // Reject writes of fields not declared in the schema.
    mongoose.set('strictQuery', true);

    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
    mongoose.connection.on('error', err => logger.error({ err }, 'MongoDB connection error'));

    const conn = await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 20,
    });
    logger.info({ host: conn.connection.host, db: conn.connection.name }, '✅ MongoDB connected');
};

export default connectDB;
