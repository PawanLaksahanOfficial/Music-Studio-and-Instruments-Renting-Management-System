import { beforeAll, afterAll, afterEach } from 'vitest';

// Must be set before config/env is imported anywhere.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-definitely-long-enough-32';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://placeholder/test';
process.env.ENABLE_CRON = 'false';

import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
    // A replica set, not a standalone server: the services under test use
    // transactions, which standalone MongoDB rejects.
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await mongoose.connect(replSet.getUri());
    await Promise.all(mongoose.modelNames().map(n => mongoose.model(n).syncIndexes()));
}, 60_000);

afterEach(async () => {
    // Clear between tests so each starts from a known state.
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.connection.close();
    await replSet?.stop();
});
