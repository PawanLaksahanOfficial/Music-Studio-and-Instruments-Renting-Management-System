import { afterAll, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { connectDB, disconnectDB } from '../config/db';
import { createApp } from '../app';
import User from '../models/User';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import { todayDateOnly } from '../utils/dates';
import { Role } from '../config/constants';

export const app = createApp();
export const PASSWORD = 'Password123';

/** Connects to a database unique to the test file and wipes business data between tests (users are kept). */
export const useDatabase = (dbName: string) => {
    beforeAll(async () => {
        const uri = new URL(process.env.MONGO_URI!);
        uri.pathname = `/${dbName}`;
        await connectDB(uri.toString());
        await mongoose.connection.dropDatabase();
        await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
    });
    beforeEach(async () => {
        const collections = await mongoose.connection.db!.collections();
        await Promise.all(collections.filter(c => c.collectionName !== 'users').map(c => c.deleteMany({})));
    });
    afterAll(async () => {
        await disconnectDB();
    });
};

export const createUser = (username: string, role: Role = 'Admin', extra: Record<string, unknown> = {}) =>
    User.create({ name: `${username} name`, username, password: PASSWORD, role, mustChangePassword: false, ...extra });

export type Agent = ReturnType<typeof request.agent>;

/** Signs in and returns a supertest agent that keeps the session cookie. */
export const signIn = async (username: string, password = PASSWORD): Promise<Agent> => {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').set('X-Requested-With', 'XMLHttpRequest').send({ username, password });
    if (res.status !== 200) throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(res.body)}`);
    return agent;
};

export const xhr = { 'X-Requested-With': 'XMLHttpRequest' };

export const createCustomer = (extra: Record<string, unknown> = {}) =>
    Customer.create({
        firstName: 'Nimal',
        lastName: 'Perera',
        phone: '0771234567',
        nicOrPassport: `NIC${Math.floor(Math.random() * 1e9)}`,
        ...extra,
    });

export const createItem = (extra: Record<string, unknown> = {}) =>
    Inventory.create({
        itemName: 'Fender Stratocaster',
        category: 'Instruments',
        serialNumber: `SN-${Math.floor(Math.random() * 1e9)}`,
        qrCodeId: `ELVI-${Math.floor(Math.random() * 1e9)}`,
        baseRentalPrice: 1500,
        ...extra,
    });

/** Calendar date `offset` days from today in the business timezone, as "YYYY-MM-DD". */
export const day = (offset = 0) => {
    const [y, m, d] = todayDateOnly().split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
};
