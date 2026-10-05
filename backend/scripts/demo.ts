/**
 * Runs the API against a throwaway in-memory MongoDB (replica set, so transactions work),
 * loaded with the sample dataset from scripts/sample-data.ts. Nothing touches your real
 * database and no SMS/email is sent.
 *
 * Usage: npm run dev:demo
 */
import { randomBytes } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const main = async () => {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

    // Set before config/env loads; dotenv never overrides existing variables.
    process.env.MONGO_URI = replSet.getUri('elvi_demo');
    process.env.JWT_SECRET = randomBytes(48).toString('base64');
    process.env.CRON_ENABLED = 'false';
    process.env.AWS_SES_FROM_EMAIL = '';
    process.env.AWS_ACCESS_KEY_ID = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';

    const { connectDB, disconnectDB } = await import('../config/db');
    const { default: User } = await import('../models/User');
    const { loadSampleData } = await import('./sample-data');

    await connectDB();

    const admin = await User.create({ name: 'Nadeesha Fernando', username: 'admin', email: 'admin@example.com', password: 'Demo1234', role: 'Admin' });
    await User.create({ name: 'Kasun Silva', username: 'cashier', email: 'cashier@example.com', password: 'Demo1234', role: 'Cashier' });
    await User.create({ name: 'Ishara Perera', username: 'ishara', password: 'Welcome123', role: 'Cashier', mustChangePassword: true });
    await User.create({ name: 'Demo Visitor', username: 'demo', password: 'Demo1234', role: 'Demo' });
    await loadSampleData({ createdBy: admin._id });

    console.log('\n  Demo data ready (in-memory database).');
    console.log('  Admin:   admin / Demo1234');
    console.log('  Cashier: cashier / Demo1234');
    console.log('  Read-only demo: demo / Demo1234');
    console.log('  Forced password change: ishara / Welcome123\n');

    // server.ts opens its own connection.
    await disconnectDB();
    await import('../server');

    const stop = async () => { await replSet.stop(); process.exit(0); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
};

main().catch(err => {
    console.error('Demo failed to start:', err);
    process.exit(1);
});
