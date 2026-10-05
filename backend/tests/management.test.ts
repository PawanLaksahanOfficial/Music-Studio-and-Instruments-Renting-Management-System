import { beforeAll, describe, expect, it } from 'vitest';
import User from '../models/User';
import Inventory from '../models/Inventory';
import Invoice from '../models/Invoice';
import { Agent, createCustomer, createItem, createUser, day, signIn, useDatabase, xhr } from './helpers';

useDatabase('management_tests');

let admin: Agent;
let adminId: string;

beforeAll(async () => {
    adminId = (await createUser('admin', 'Admin')).id;
    admin = await signIn('admin');
});

describe('user management guards', () => {
    it('prevents admins from deleting, deactivating or demoting themselves', async () => {
        expect((await admin.delete(`/api/users/${adminId}`).set(xhr)).status).toBe(403);
        expect((await admin.patch(`/api/users/${adminId}/toggle-active`).set(xhr)).status).toBe(403);
        expect((await admin.patch(`/api/users/${adminId}`).set(xhr).send({ role: 'Cashier' })).status).toBe(403);
    });

    it('requires the change-password flow (with current password) for your own password', async () => {
        const res = await admin.patch(`/api/users/${adminId}`).set(xhr).send({ password: 'Sneaky2026x' });
        expect(res.status).toBe(403);
        expect((await admin.get('/api/auth/me')).status).toBe(200);
    });

    it('creates users with a temporary password and never returns password hashes', async () => {
        const res = await admin.post('/api/users').set(xhr).send({ name: 'Kamal', username: 'kamal', password: 'Welcome123', role: 'Cashier' });
        expect(res.status).toBe(201);
        expect(res.body.mustChangePassword).toBe(true);

        const list = await admin.get('/api/users');
        expect(JSON.stringify(list.body)).not.toMatch(/password"|\$2[aby]\$/);
    });

    it('does not reset the password when email is not configured', async () => {
        await createUser('mailme', 'Cashier', { email: 'mailme@example.com' });
        const before = await User.findOne({ username: 'mailme' }).select('+password');

        const res = await admin.post(`/api/users/${before!.id}/send-login-details`).set(xhr);

        expect(res.status).toBe(503);
        const after = await User.findOne({ username: 'mailme' }).select('+password');
        expect(after!.password).toBe(before!.password);
    });

    it('keeps users who issued invoices for the audit trail', async () => {
        const issuer = await createUser('issuer', 'Cashier');
        const customer = await createCustomer();
        await Invoice.create({
            invoiceId: 'INV-T-1', customer: customer._id, items: [{ description: 'x', quantity: 1, unitPrice: 1, total: 1 }],
            subtotal: 1, totalAmount: 1, paymentMethod: 'Cash', createdBy: issuer._id,
        });

        expect((await admin.delete(`/api/users/${issuer.id}`).set(xhr)).status).toBe(409);
    });
});

describe('read-only demo account', () => {
    let visitor: Agent;

    beforeAll(async () => {
        await createUser('visitor', 'Demo');
        visitor = await signIn('visitor');
    });

    it('can view every area, including admin pages', async () => {
        for (const url of ['/api/rentals', '/api/customers', '/api/customers/archived', '/api/inventory/archived', '/api/users', '/api/stats/summary']) {
            expect((await visitor.get(url)).status, url).toBe(200);
        }
    });

    it('cannot change anything', async () => {
        const create = await visitor.post('/api/customers').set(xhr).send({ firstName: 'A', lastName: 'B', phone: '0771234567', nicOrPassport: 'DEMO12345' });
        expect(create.status).toBe(403);
        expect(create.body.code).toBe('DEMO_READ_ONLY');
        expect((await visitor.delete(`/api/users/${adminId}`).set(xhr)).status).toBe(403);
        expect((await visitor.post('/api/cron/trigger-reminders').set(xhr)).status).toBe(403);
        expect((await visitor.patch('/api/auth/password').set(xhr).send({ currentPassword: 'Password123', newPassword: 'Hijacked2026' })).status).toBe(403);
    });

    it("signing out doesn't end other visitors' sessions", async () => {
        const other = await signIn('visitor');
        expect((await other.post('/api/auth/logout').set(xhr)).status).toBe(204);
        expect((await visitor.get('/api/auth/me')).status).toBe(200);
    });

    it('admin-created demo accounts are never forced to change their password', async () => {
        const res = await admin.post('/api/users').set(xhr).send({ name: 'Guest', username: 'guest', password: 'Guest2026', role: 'Demo' });
        expect(res.status).toBe(201);
        expect(res.body.mustChangePassword).toBe(false);
    });
});

describe('inventory and customers', () => {
    it('saves itemModel and notes, and generates the QR id on the server', async () => {
        const res = await admin.post('/api/inventory').set(xhr).send({
            itemName: 'Yamaha P-125', category: 'Instruments', itemModel: 'P-125', serialNumber: 'YP125-001',
            baseRentalPrice: 2500, notes: 'Includes stand', qrCodeId: 'ELVI-HACKED', status: 'Rented',
        });

        expect(res.status).toBe(400); // "Rented" can only be set by the rental workflow

        const ok = await admin.post('/api/inventory').set(xhr).send({
            itemName: 'Yamaha P-125', category: 'Instruments', itemModel: 'P-125', serialNumber: 'YP125-001',
            baseRentalPrice: 2500, notes: 'Includes stand', qrCodeId: 'ELVI-HACKED',
        });
        expect(ok.status).toBe(201);
        expect(ok.body).toMatchObject({ itemModel: 'P-125', notes: 'Includes stand', status: 'Available' });
        expect(ok.body.qrCodeId).not.toBe('ELVI-HACKED');

        const byQr = await admin.get(`/api/inventory/qr/${encodeURIComponent(`${ok.body.qrCodeId}|Yamaha|YP125-001|2500`)}`);
        expect(byQr.body._id).toBe(ok.body._id);
    });

    it('does not let a partial update reset other fields', async () => {
        const item = await createItem({ status: 'Maintenance' });
        const res = await admin.patch(`/api/inventory/${item.id}`).set(xhr).send({ notes: 'New strings' });
        expect(res.body.status).toBe('Maintenance');
    });

    it('protects history: no hard delete of rented items or customers with rentals', async () => {
        const customer = await createCustomer();
        const item = await createItem();
        await admin.post('/api/rentals').set(xhr).send({ customerId: customer.id, itemIds: [item.id], dueDate: day(1) });

        expect((await admin.delete(`/api/inventory/${item.id}`).set(xhr)).status).toBe(409);
        expect((await admin.patch(`/api/inventory/${item.id}/archive`).set(xhr)).status).toBe(409);
        expect((await admin.delete(`/api/customers/${customer.id}`).set(xhr)).status).toBe(409);
        expect((await admin.patch(`/api/customers/${customer.id}/archive`).set(xhr)).status).toBe(409);
        expect((await Inventory.findById(item.id))!.isArchived).toBe(false);
    });

    it('rejects duplicate NIC numbers regardless of case', async () => {
        await createCustomer({ nicOrPassport: '991234567V' });
        const res = await admin.post('/api/customers').set(xhr).send({
            firstName: 'A', lastName: 'B', phone: '0771234567', nicOrPassport: '991234567v',
        });
        expect(res.status).toBe(409);
    });
});

describe('statistics', () => {
    it('summarizes inventory without archived items', async () => {
        await createItem();
        await createItem({ status: 'Damaged' });
        await createItem({ isArchived: true });

        const res = await admin.get('/api/stats/summary');

        expect(res.status).toBe(200);
        expect(res.body.inventory).toMatchObject({ total: 2, available: 1, damaged: 1 });
    });

    it('validates the date range', async () => {
        const res = await admin.get('/api/stats/monthly').query({ start: '2026-12-01', end: '2026-01-01' });
        expect(res.status).toBe(400);
    });
});
