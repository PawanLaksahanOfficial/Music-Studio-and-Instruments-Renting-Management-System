import { beforeAll, describe, expect, it, vi } from 'vitest';
import Inventory from '../models/Inventory';
import ProductRental from '../models/ProductRental';
import Invoice from '../models/Invoice';
import { parseDateOnly } from '../utils/dates';
import { markOverdueRentals, runDueDateReminders } from '../utils/cronJobs';
import { sendEmail, sendSMS } from '../utils/aws';
import { Agent, createCustomer, createItem, createUser, day, signIn, useDatabase, xhr } from './helpers';

vi.mock('../utils/aws', () => ({
    sendSMS: vi.fn().mockResolvedValue({ MessageId: 'sms' }),
    sendEmail: vi.fn().mockResolvedValue({ MessageId: 'email' }),
    isEmailConfigured: () => true,
}));

useDatabase('rental_tests');

let admin: Agent;
let cashier: Agent;

beforeAll(async () => {
    await createUser('admin', 'Admin');
    await createUser('cashier', 'Cashier');
    admin = await signIn('admin');
    cashier = await signIn('cashier');
});

/** A rental created directly in the database, e.g. with dates in the past. */
const seedRental = async (opts: { rentalDate: string; dueDate: string; rate?: number; status?: 'Rented' | 'Overdue' }) => {
    const customer = await createCustomer();
    const item = await createItem({ status: 'Rented', baseRentalPrice: opts.rate ?? 1000 });
    const rental = await ProductRental.create({
        rentalId: `PR-TEST-${Math.random()}`,
        customer: customer._id,
        items: [{ itemId: item._id, dailyRate: opts.rate ?? 1000 }],
        rentalDate: parseDateOnly(opts.rentalDate),
        dueDate: parseDateOnly(opts.dueDate),
        baseAmount: 3000,
        totalAmount: 3000,
        status: opts.status ?? 'Rented',
    });
    return { customer, item, rental };
};

describe('creating rentals', () => {
    it('computes the price on the server and ignores a client-supplied total', async () => {
        const customer = await createCustomer();
        const item = await createItem({ baseRentalPrice: 1500 });

        const res = await cashier.post('/api/rentals').set(xhr).send({
            customerId: customer.id, itemIds: [item.id], dueDate: day(3), totalAmount: 1,
        });

        expect(res.status).toBe(201);
        expect(res.body.rental.totalAmount).toBe(4500); // 3 days x 1500
        expect(res.body.rental.rentalId).toMatch(/^PR-\d{4}-\d{6}$/);
        expect((await Inventory.findById(item.id))!.status).toBe('Rented');
    });

    it('lets only one of two simultaneous rentals of the same item succeed', async () => {
        const [c1, c2] = await Promise.all([createCustomer(), createCustomer()]);
        const item = await createItem();

        const results = await Promise.all([
            cashier.post('/api/rentals').set(xhr).send({ customerId: c1.id, itemIds: [item.id], dueDate: day(2) }),
            admin.post('/api/rentals').set(xhr).send({ customerId: c2.id, itemIds: [item.id], dueDate: day(2) }),
        ]);

        expect(results.map(r => r.status).sort()).toEqual([201, 409]);
        expect(await ProductRental.countDocuments({ 'items.itemId': item._id })).toBe(1);
    });

    it('rolls back every reservation when one item is unavailable', async () => {
        const customer = await createCustomer();
        const free = await createItem();
        const busy = await createItem({ status: 'Maintenance' });

        const res = await cashier.post('/api/rentals').set(xhr).send({ customerId: customer.id, itemIds: [free.id, busy.id], dueDate: day(1) });

        expect(res.status).toBe(409);
        expect((await Inventory.findById(free.id))!.status).toBe('Available');
    });

    it('refuses blacklisted customers and past rental dates', async () => {
        const blocked = await createCustomer({ isBlacklisted: true });
        const okCustomer = await createCustomer();
        const item = await createItem();

        expect((await cashier.post('/api/rentals').set(xhr).send({ customerId: blocked.id, itemIds: [item.id], dueDate: day(1) })).status).toBe(403);
        expect((await cashier.post('/api/rentals').set(xhr).send({
            customerId: okCustomer.id, itemIds: [item.id], rentalDate: day(-2), dueDate: day(1),
        })).status).toBe(400);
    });

    it('creates the rental and its linked invoice atomically for QR checkout', async () => {
        const customer = await createCustomer();
        const item = await createItem({ baseRentalPrice: 2000 });

        const res = await cashier.post('/api/rentals').set(xhr).send({
            customerId: customer.id, itemIds: [item.id], dueDate: day(2),
            invoice: { paymentMethod: 'Cash', paymentStatus: 'Paid', tax: 250 },
        });

        expect(res.status).toBe(201);
        expect(res.body.invoice.totalAmount).toBe(4250);
        expect(res.body.invoice.productRentals[0]._id).toBe(res.body.rental._id);
        const rental = await ProductRental.findById(res.body.rental._id);
        expect(rental!.paymentStatus).toBe('Paid');
    });

    it('re-prices a rental when its due date is extended', async () => {
        const customer = await createCustomer();
        const item = await createItem({ baseRentalPrice: 1000 });
        const created = await cashier.post('/api/rentals').set(xhr).send({ customerId: customer.id, itemIds: [item.id], dueDate: day(2), paymentStatus: 'Paid' });

        const res = await cashier.patch(`/api/rentals/${created.body.rental._id}/extend`).set(xhr).send({ newDueDate: day(5) });

        expect(res.status).toBe(200);
        expect(res.body.totalAmount).toBe(5000);
        expect(res.body.paymentStatus).toBe('Partial');
    });
});

describe('returning rentals', () => {
    it('computes the late fee on the server and frees undamaged items', async () => {
        const { rental, item } = await seedRental({ rentalDate: day(-6), dueDate: day(-3), rate: 1000 });

        const quote = await cashier.get(`/api/rentals/${rental.id}/return-quote`).query({ returnDate: day(0) });
        expect(quote.body).toMatchObject({ lateDays: 3, lateFee: 3000 });

        const res = await cashier.post(`/api/rentals/${rental.id}/return`).set(xhr).send({
            returnDate: day(0), paymentStatus: 'Paid', lateFee: 0, // a client-sent lateFee is ignored
        });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ status: 'Returned', lateFee: 3000, totalAmount: 6000 });
        expect((await Inventory.findById(item.id))!.status).toBe('Available');
    });

    it('marks only the damaged item as Damaged', async () => {
        const { rental, item } = await seedRental({ rentalDate: day(-2), dueDate: day(0) });

        const res = await cashier.post(`/api/rentals/${rental.id}/return`).set(xhr).send({
            returnDate: day(0), paymentStatus: 'Pending', damageCharges: 500, damagedItemIds: [item.id],
        });

        expect(res.body.totalAmount).toBe(3500);
        expect((await Inventory.findById(item.id))!.status).toBe('Damaged');
    });

    it('allows late-fee overrides for admins only', async () => {
        const { rental } = await seedRental({ rentalDate: day(-6), dueDate: day(-3) });
        const body = { returnDate: day(0), paymentStatus: 'Paid', lateFeeOverride: 0 };

        expect((await cashier.post(`/api/rentals/${rental.id}/return`).set(xhr).send(body)).status).toBe(403);
        const res = await admin.post(`/api/rentals/${rental.id}/return`).set(xhr).send(body);
        expect(res.body.lateFee).toBe(0);
    });

    it('refuses to delete a rental that has been invoiced', async () => {
        const customer = await createCustomer();
        const item = await createItem();
        const created = await cashier.post('/api/rentals').set(xhr).send({
            customerId: customer.id, itemIds: [item.id], dueDate: day(1), invoice: { paymentMethod: 'Card' },
        });

        const res = await admin.delete(`/api/rentals/${created.body.rental._id}`).set(xhr);
        expect(res.status).toBe(409);
        expect(await Invoice.countDocuments()).toBe(1);
    });
});

describe('scheduled jobs', () => {
    it('marks rentals past their due date as Overdue', async () => {
        const { rental } = await seedRental({ rentalDate: day(-4), dueDate: day(-1) });
        const current = await seedRental({ rentalDate: day(-1), dueDate: day(0) });

        expect(await markOverdueRentals()).toBe(1);
        expect((await ProductRental.findById(rental.id))!.status).toBe('Overdue');
        expect((await ProductRental.findById(current.rental.id))!.status).toBe('Rented');
    });

    it('sends each reminder only once', async () => {
        await seedRental({ rentalDate: day(-2), dueDate: day(1) });
        vi.mocked(sendSMS).mockClear();
        vi.mocked(sendEmail).mockClear();

        const first = await runDueDateReminders();
        const second = await runDueDateReminders();

        expect(first.sent).toBe(1);
        expect(second).toMatchObject({ sent: 0, skipped: 1 });
        expect(sendSMS).toHaveBeenCalledTimes(1);
    });
});
