/**
 * Loads the sample dataset (scripts/sample-data.ts) into the database in MONGO_URI, and creates
 * the read-only "demo" account if it doesn't exist. Only adds data; safe to run twice (the second
 * run does nothing).
 *
 * Usage: npm run seed:sample
 * Demo login: DEMO_USERNAME / DEMO_PASSWORD from the environment, default demo / Demo1234.
 */
import { randomBytes } from 'node:crypto';
import '../config/env';
import { connectDB, disconnectDB } from '../config/db';
import User from '../models/User';
import { loadSampleData } from './sample-data';

const DEMO_USERNAME = (process.env.DEMO_USERNAME || 'demo').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo1234';

const run = async () => {
    await connectDB();

    const admin = await User.findOne({ role: 'Admin', isActive: true }).sort({ createdAt: 1 });
    if (!admin) throw new Error('No active admin found. Run "npm run seed" first.');

    const summary = await loadSampleData({ createdBy: admin._id });
    console.log(summary.skipped
        ? '\nSample data is already loaded. Nothing was added.'
        : `\nAdded ${summary.customers} customers, ${summary.items} inventory items, ${summary.rentals} rentals, ${summary.bookings} studio bookings and ${summary.invoices} invoices.`);

    if (!(await User.exists({ username: DEMO_USERNAME }))) {
        await User.create({ name: 'Demo Visitor', username: DEMO_USERNAME, password: DEMO_PASSWORD, role: 'Demo' });
        console.log(`Created the read-only demo account: ${DEMO_USERNAME} / ${DEMO_PASSWORD}`);
    } else {
        console.log(`Demo account "${DEMO_USERNAME}" already exists.`);
    }

    // A sample cashier so Staff Users shows more than one role. Its random password is never shown.
    if (!(await User.exists({ username: 'kasun' }))) {
        await User.create({ name: 'Kasun Silva', username: 'kasun', email: 'kasun.s@example.com', password: `${randomBytes(18).toString('base64url')}9a`, role: 'Cashier', mustChangePassword: true });
        console.log('Created sample cashier "kasun" (no usable password).');
    }
};

run()
    .catch(err => {
        console.error('Loading sample data failed:', err.message);
        process.exitCode = 1;
    })
    .finally(() => disconnectDB());
