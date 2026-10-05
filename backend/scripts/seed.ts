/**
 * Creates the first Admin account if it doesn't exist.
 * Usage: npm run seed            (password from SEED_ADMIN_PASSWORD, or a generated one)
 * The admin must choose a new password on first sign-in.
 */
import { randomBytes } from 'node:crypto';
import '../config/env';
import { connectDB, disconnectDB } from '../config/db';
import User from '../models/User';

const USERNAME = (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase();

const run = async () => {
    await connectDB();

    if (await User.exists({ username: USERNAME })) {
        console.log(`Admin user "${USERNAME}" already exists. Nothing to do.`);
        return;
    }

    const provided = process.env.SEED_ADMIN_PASSWORD;
    const password = provided || `${randomBytes(9).toString('base64url')}7a`;

    await User.create({
        name: 'System Admin',
        username: USERNAME,
        password,
        role: 'Admin',
        isActive: true,
        mustChangePassword: true,
    });

    console.log(`\nAdmin user created.\n  Username: ${USERNAME}`);
    if (!provided) console.log(`  Temporary password: ${password}\n  (shown once — you will be asked to change it at first sign-in)`);
};

run()
    .catch(err => {
        console.error('Seeding failed:', err.message);
        process.exitCode = 1;
    })
    .finally(() => disconnectDB());
