import { beforeAll, describe, expect, it } from 'vitest';
import ProductRental from '../models/ProductRental';
import { Agent, createCustomer, createItem, createUser, day, signIn, useDatabase, xhr } from './helpers';

useDatabase('invoice_studio_tests');

let admin: Agent;

beforeAll(async () => {
    await createUser('admin', 'Admin');
    admin = await signIn('admin');
});

describe('invoices', () => {
    it('recomputes line totals, subtotal and total on the server', async () => {
        const customer = await createCustomer();

        const res = await admin.post('/api/invoices').set(xhr).send({
            customerId: customer.id,
            items: [{ description: 'Guitar strings', quantity: 2, unitPrice: 750, total: 1 }],
            subtotal: 1, totalAmount: 1, tax: 100, paymentMethod: 'Cash',
        });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ subtotal: 1500, tax: 100, totalAmount: 1600 });
        expect(res.body.items[0]).toMatchObject({ total: 1500, kind: 'other' });
        expect(res.body.invoiceId).toMatch(/^INV-\d{4}-\d{6}$/);
    });

    it("rejects linking another customer's rental and double billing", async () => {
        const [owner, other] = await Promise.all([createCustomer(), createCustomer()]);
        const item = await createItem();
        const rental = await admin.post('/api/rentals').set(xhr).send({ customerId: owner.id, itemIds: [item.id], dueDate: day(1) });
        const rentalId = rental.body.rental._id;

        const wrongCustomer = await admin.post('/api/invoices').set(xhr).send({ customerId: other.id, productRentalIds: [rentalId], paymentMethod: 'Cash' });
        expect(wrongCustomer.status).toBe(400);

        const first = await admin.post('/api/invoices').set(xhr).send({ customerId: owner.id, productRentalIds: [rentalId], paymentMethod: 'Cash' });
        expect(first.status).toBe(201);
        expect(first.body.totalAmount).toBe(1500);

        const second = await admin.post('/api/invoices').set(xhr).send({ customerId: owner.id, productRentalIds: [rentalId], paymentMethod: 'Cash' });
        expect(second.status).toBe(409);
    });

    it('marks linked rentals paid when the invoice is paid', async () => {
        const customer = await createCustomer();
        const item = await createItem();
        const rental = await admin.post('/api/rentals').set(xhr).send({ customerId: customer.id, itemIds: [item.id], dueDate: day(1) });
        const invoice = await admin.post('/api/invoices').set(xhr).send({ customerId: customer.id, productRentalIds: [rental.body.rental._id], paymentMethod: 'Card' });

        const paid = await admin.patch(`/api/invoices/${invoice.body._id}/payment`).set(xhr).send({ paymentStatus: 'Paid' });

        expect(paid.body.paidAt).toBeTruthy();
        expect((await ProductRental.findById(rental.body.rental._id))!.paymentStatus).toBe('Paid');
    });
});

describe('studio bookings', () => {
    const at = (hour: number) => `${day(1)}T${String(hour).padStart(2, '0')}:00:00.000Z`;
    const book = (customerId: string, start: number, end: number, roomName = 'Studio A') =>
        admin.post('/api/studio-rentals').set(xhr).send({ customerId, roomName, startTime: at(start), endTime: at(end), totalAmount: 5000 });

    it('rejects overlapping bookings but allows back-to-back ones', async () => {
        const customer = await createCustomer();
        expect((await book(customer.id, 10, 12)).status).toBe(201);
        expect((await book(customer.id, 11, 13)).status).toBe(409);
        expect((await book(customer.id, 12, 14)).status).toBe(201);
        expect((await book(customer.id, 11, 13, 'Studio B')).status).toBe(201);
    });

    it('lets only one of two simultaneous overlapping bookings succeed', async () => {
        const customer = await createCustomer();
        const results = await Promise.all([book(customer.id, 15, 17), book(customer.id, 16, 18)]);
        expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    });

    it('re-checks conflicts and recalculates duration on update', async () => {
        const customer = await createCustomer();
        await book(customer.id, 8, 9);
        const second = await book(customer.id, 9, 10);

        const clash = await admin.patch(`/api/studio-rentals/${second.body._id}`).set(xhr).send({ startTime: at(8) });
        expect(clash.status).toBe(409);

        const longer = await admin.patch(`/api/studio-rentals/${second.body._id}`).set(xhr).send({ endTime: at(12) });
        expect(longer.status).toBe(200);
        expect(longer.body.durationHours).toBe(3);
    });

    it('rejects an end time before the start time', async () => {
        const customer = await createCustomer();
        expect((await book(customer.id, 14, 13)).status).toBe(400);
    });
});
