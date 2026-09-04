/**
 * Bootstraps a usable database: one Admin account and the default studio rooms.
 *
 * Usage: npm run seed
 *
 * The admin password is generated randomly and printed once. It is never
 * committed, and the account is flagged `mustChangePassword`, so the printed
 * value is only good for the first sign-in.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import connectDB from '../config/db';
import User from '../models/User';
import Room from '../models/Room';

const DEFAULT_ROOMS = [
    { name: 'Live Room A', hourlyRate: 2500, capacity: 8, description: 'Main tracking room' },
    { name: 'Live Room B', hourlyRate: 1800, capacity: 4, description: 'Overdub and rehearsal space' },
    { name: 'Control Room', hourlyRate: 3200, capacity: 3, description: 'Mixing and mastering suite' },
];

/** 18 URL-safe bytes gives ~96 bits of entropy — far beyond a typed password. */
const generatePassword = () => crypto.randomBytes(18).toString('base64url');

const seed = async () => {
    await connectDB();

    const results: string[] = [];

    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
        results.push('• Admin account already exists — left untouched');
    } else {
        const password = generatePassword();
        await User.create({
            name: 'System Admin',
            username: 'admin',
            password,
            role: 'Admin',
            isActive: true,
            mustChangePassword: true,
        });
        results.push(
            '• Admin account created\n' +
                `    username : admin\n` +
                `    password : ${password}\n` +
                '    ⚠  Shown once. You will be asked to change it at first sign-in.'
        );
    }

    for (const room of DEFAULT_ROOMS) {
        const existing = await Room.findOne({ name: room.name });
        if (existing) {
            results.push(`• Room "${room.name}" already exists`);
        } else {
            await Room.create(room);
            results.push(`• Room "${room.name}" created at Rs. ${room.hourlyRate}/hour`);
        }
    }

    // Builds any index declared on a schema but not yet present in the database.
    await Promise.all(mongoose.modelNames().map(n => mongoose.model(n).syncIndexes()));
    results.push('• Indexes synced');

    console.log(`\n✅ Seed complete (${env.NODE_ENV})\n\n${results.join('\n')}\n`);
    await mongoose.connection.close();
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
