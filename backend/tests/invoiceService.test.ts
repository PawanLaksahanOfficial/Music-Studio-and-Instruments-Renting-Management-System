import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import invoiceService from '../services/invoiceService';
import rentalService from '../services/rentalService';
import ProductRental from '../models/ProductRental';
import { makeUser, makeCustomer, makeItem, tokenFor, daysFromNow } from './helpers';

const app = createApp();

const rentalFor = async (customerId: string, rate = 1000, days = 2) => {
    const item = await makeItem({ baseRentalPrice: rate });
    return rentalService.createNewRental({
        customerId,
        items: [{ itemId: String(item._id), quantity: 1 }],
        rentalDate: daysFromNow(0),
        dueDate: daysFromNow(days),
    });
};

describe('createInvoice', () => {
    it('derives line amounts from the linked rental, not the request', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const rental = await rentalFor(String(customer._id), 1000, 3);

        const invoice = await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                productRentalIds: [String(rental!._id)],
                paymentMethod: 'Cash',
            },
            String(user._id)
        );

        expect(invoice!.subtotal).toBe(3000);
        expect(invoice!.totalAmount).toBe(3000);
        expect(invoice!.items[0].sourceType).toBe('ProductRental');
        expect(String(invoice!.items[0].sourceId)).toBe(String(rental!._id));
    });

    it('computes tax from the rate rather than trusting a supplied figure', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const rental = await rentalFor(String(customer._id), 1000, 2);

        const invoice = await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                productRentalIds: [String(rental!._id)],
                taxRate: 15,
                paymentMethod: 'Card',
            },
            String(user._id)
        );

        expect(invoice!.subtotal).toBe(2000);
        expect(invoice!.tax).toBe(300);
        expect(invoice!.totalAmount).toBe(2300);
    });

    it('tags manual lines so they are not counted as rental revenue', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();

        const invoice = await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                manualItems: [{ description: 'Replacement strings', quantity: 2, unitPrice: 750 }],
                paymentMethod: 'Cash',
            },
            String(user._id)
        );

        expect(invoice!.items[0].sourceType).toBe('Manual');
        expect(invoice!.totalAmount).toBe(1500);
    });

    it('refuses to mix rentals belonging to different customers', async () => {
        const user = await makeUser();
        const [c1, c2] = await Promise.all([makeCustomer(), makeCustomer()]);
        const rental = await rentalFor(String(c2._id));

        await expect(
            invoiceService.createInvoice(
                {
                    customerId: String(c1._id),
                    productRentalIds: [String(rental!._id)],
                    paymentMethod: 'Cash',
                },
                String(user._id)
            )
        ).rejects.toThrow(/same customer/);
    });

    it('rejects an invoice with nothing on it', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();

        await expect(
            invoiceService.createInvoice(
                { customerId: String(customer._id), paymentMethod: 'Cash' },
                String(user._id)
            )
        ).rejects.toThrow(/at least one/);
    });

    it('marks linked rentals paid when the invoice is created as Paid', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const rental = await rentalFor(String(customer._id));

        await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                productRentalIds: [String(rental!._id)],
                paymentMethod: 'Cash',
                paymentStatus: 'Paid',
            },
            String(user._id)
        );

        expect((await ProductRental.findById(rental!._id))!.paymentStatus).toBe('Paid');
    });

    it('sets paidAt when payment is recorded', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const rental = await rentalFor(String(customer._id));

        const invoice = await invoiceService.createInvoice(
            { customerId: String(customer._id), productRentalIds: [String(rental!._id)], paymentMethod: 'Cash' },
            String(user._id)
        );
        expect(invoice!.paidAt).toBeUndefined();

        const paid = await invoiceService.updatePaymentStatus(String(invoice!._id), 'Paid');
        expect(paid!.paidAt).toBeInstanceOf(Date);
    });

    it('allocates sequential invoice numbers', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();

        const first = await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                manualItems: [{ description: 'A', quantity: 1, unitPrice: 100 }],
                paymentMethod: 'Cash',
            },
            String(user._id)
        );
        const second = await invoiceService.createInvoice(
            {
                customerId: String(customer._id),
                manualItems: [{ description: 'B', quantity: 1, unitPrice: 100 }],
                paymentMethod: 'Cash',
            },
            String(user._id)
        );

        expect(first!.invoiceId).toBe('INV-000001');
        expect(second!.invoiceId).toBe('INV-000002');
    });
});

describe('POST /api/invoices', () => {
    it('ignores a client-supplied total', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const rental = await rentalFor(String(customer._id), 1000, 3);

        const res = await request(app)
            .post('/api/invoices')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({
                customerId: String(customer._id),
                productRentalIds: [String(rental!._id)],
                paymentMethod: 'Cash',
                // A client attempting to name its own price.
                subtotal: 1,
                tax: 0,
                totalAmount: 1,
            });

        expect(res.status).toBe(201);
        expect(res.body.totalAmount).toBe(3000);
    });
});

describe('POST /api/rentals', () => {
    it('ignores a client-supplied rental total', async () => {
        const user = await makeUser();
        const customer = await makeCustomer();
        const item = await makeItem({ baseRentalPrice: 2000 });

        const res = await request(app)
            .post('/api/rentals')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({
                customerId: String(customer._id),
                items: [{ itemId: String(item._id), quantity: 1 }],
                rentalDate: daysFromNow(0).toISOString(),
                dueDate: daysFromNow(2).toISOString(),
                totalAmount: 0,
            });

        expect(res.status).toBe(201);
        expect(res.body.totalAmount).toBe(4000);
    });

    it('rejects an invalid customer id', async () => {
        const user = await makeUser();
        const res = await request(app)
            .post('/api/rentals')
            .set('Authorization', `Bearer ${tokenFor(user)}`)
            .send({ customerId: 'not-an-id', items: [], dueDate: daysFromNow(1).toISOString() });

        expect(res.status).toBe(400);
    });
});
