import { describe, it, expect } from 'vitest';
import rentalService from '../services/rentalService';
import Inventory from '../models/Inventory';
import ProductRental from '../models/ProductRental';
import Customer from '../models/Customer';
import { makeCustomer, makeItem, daysFromNow } from './helpers';

describe('createNewRental', () => {
    it('prices the rental server-side from stored rates', async () => {
        const customer = await makeCustomer();
        const item = await makeItem({ baseRentalPrice: 1200 });

        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            rentalDate: daysFromNow(0),
            dueDate: daysFromNow(3),
        });

        // 1200/day × 3 days — not whatever a client might have posted.
        expect(rental!.baseAmount).toBe(3600);
        expect(rental!.totalAmount).toBe(3600);
        expect(rental!.rentalId).toMatch(/^PR-\d{6}$/);
    });

    it('marks the claimed items as rented', async () => {
        const customer = await makeCustomer();
        const item = await makeItem();

        await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            dueDate: daysFromNow(2),
        });

        expect((await Inventory.findById(item._id))!.status).toBe('Rented');
    });

    it('appends the rental to the customer history', async () => {
        const customer = await makeCustomer();
        const item = await makeItem();

        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            dueDate: daysFromNow(2),
        });

        const updated = await Customer.findById(customer._id);
        expect(updated!.rentalHistory.map(String)).toContain(String(rental!._id));
    });

    it('refuses to rent an item that is already out', async () => {
        const customer = await makeCustomer();
        const item = await makeItem({ status: 'Rented' });

        await expect(
            rentalService.createNewRental({
                customerId: String(customer._id),
                items: [{ itemId: String(item._id), quantity: 1 }],
                dueDate: daysFromNow(2),
            })
        ).rejects.toThrow(/No longer available|taken by another checkout/);
    });

    it('refuses a blacklisted customer', async () => {
        const customer = await makeCustomer({ isBlacklisted: true });
        const item = await makeItem();

        await expect(
            rentalService.createNewRental({
                customerId: String(customer._id),
                items: [{ itemId: String(item._id), quantity: 1 }],
                dueDate: daysFromNow(2),
            })
        ).rejects.toThrow(/blacklisted/);
    });

    it('rejects a due date before the rental date', async () => {
        const customer = await makeCustomer();
        const item = await makeItem();

        await expect(
            rentalService.createNewRental({
                customerId: String(customer._id),
                items: [{ itemId: String(item._id), quantity: 1 }],
                rentalDate: daysFromNow(5),
                dueDate: daysFromNow(2),
            })
        ).rejects.toThrow(/Due date cannot be before/);
    });

    it('leaves no partial state behind when the transaction fails', async () => {
        const customer = await makeCustomer({ isBlacklisted: true });
        const item = await makeItem();

        await expect(
            rentalService.createNewRental({
                customerId: String(customer._id),
                items: [{ itemId: String(item._id), quantity: 1 }],
                dueDate: daysFromNow(2),
            })
        ).rejects.toThrow();

        // The item must not have been claimed by the aborted attempt.
        expect((await Inventory.findById(item._id))!.status).toBe('Available');
        expect(await ProductRental.countDocuments()).toBe(0);
    });

    it('only one of two concurrent checkouts of the same item can win', async () => {
        const [c1, c2] = await Promise.all([makeCustomer(), makeCustomer()]);
        const item = await makeItem();

        const attempt = (customerId: string) =>
            rentalService.createNewRental({
                customerId,
                items: [{ itemId: String(item._id), quantity: 1 }],
                dueDate: daysFromNow(2),
            });

        const results = await Promise.allSettled([attempt(String(c1._id)), attempt(String(c2._id))]);
        const fulfilled = results.filter(r => r.status === 'fulfilled');

        expect(fulfilled).toHaveLength(1);
        expect(await ProductRental.countDocuments()).toBe(1);
    });
});

describe('processReturn', () => {
    const setUpRental = async (dueInDays: number, rate = 1000) => {
        const customer = await makeCustomer();
        const item = await makeItem({ baseRentalPrice: rate });
        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            rentalDate: daysFromNow(0),
            dueDate: daysFromNow(dueInDays),
        });
        return { rental: rental!, item };
    };

    it('preserves baseAmount when adding late and damage charges', async () => {
        const { rental, item } = await setUpRental(2);
        const original = rental.baseAmount;

        const returned = await rentalService.processReturn({
            rentalId: String(rental._id),
            returnDate: daysFromNow(4),
            damages: [{ itemId: String(item._id), charge: 500, note: 'Cracked body' }],
            paymentStatus: 'Paid',
        });

        // The checkout price survives the return — the old code overwrote it,
        // destroying the only record of what the rental originally cost.
        expect(returned!.baseAmount).toBe(original);
        expect(returned!.lateFee).toBe(2000); // 1000/day × 2 days late
        expect(returned!.damageCharges).toBe(500);
        expect(returned!.totalAmount).toBe(original + 2000 + 500);
    });

    it('quarantines only the damaged item, not every item on the rental', async () => {
        const customer = await makeCustomer();
        const [damaged, clean] = await Promise.all([makeItem(), makeItem()]);

        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [
                { itemId: String(damaged._id), quantity: 1 },
                { itemId: String(clean._id), quantity: 1 },
            ],
            dueDate: daysFromNow(2),
        });

        await rentalService.processReturn({
            rentalId: String(rental!._id),
            returnDate: daysFromNow(1),
            damages: [{ itemId: String(damaged._id), charge: 750 }],
            paymentStatus: 'Pending',
        });

        expect((await Inventory.findById(damaged._id))!.status).toBe('Damaged');
        expect((await Inventory.findById(clean._id))!.status).toBe('Available');
    });

    it('releases every item when nothing is damaged', async () => {
        const { rental, item } = await setUpRental(3);

        await rentalService.processReturn({
            rentalId: String(rental._id),
            returnDate: daysFromNow(2),
            paymentStatus: 'Paid',
        });

        expect((await Inventory.findById(item._id))!.status).toBe('Available');
    });

    it('charges no late fee for an on-time return', async () => {
        const { rental } = await setUpRental(5);

        const returned = await rentalService.processReturn({
            rentalId: String(rental._id),
            returnDate: daysFromNow(5),
            paymentStatus: 'Paid',
        });

        expect(returned!.lateFee).toBe(0);
        expect(returned!.totalAmount).toBe(returned!.baseAmount);
    });

    it('refuses to process the same return twice', async () => {
        const { rental } = await setUpRental(2);

        await rentalService.processReturn({
            rentalId: String(rental._id),
            returnDate: daysFromNow(1),
            paymentStatus: 'Paid',
        });

        await expect(
            rentalService.processReturn({
                rentalId: String(rental._id),
                returnDate: daysFromNow(1),
                paymentStatus: 'Paid',
            })
        ).rejects.toThrow(/already been returned/);
    });

    it('rejects damage reported against an item not on the rental', async () => {
        const { rental } = await setUpRental(2);
        const other = await makeItem();

        await expect(
            rentalService.processReturn({
                rentalId: String(rental._id),
                returnDate: daysFromNow(1),
                damages: [{ itemId: String(other._id), charge: 100 }],
                paymentStatus: 'Paid',
            })
        ).rejects.toThrow(/not on this rental/);
    });
});

describe('extendDueDate', () => {
    it('re-prices the rental for the longer period', async () => {
        const customer = await makeCustomer();
        const item = await makeItem({ baseRentalPrice: 1000 });
        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            rentalDate: daysFromNow(0),
            dueDate: daysFromNow(2),
        });
        expect(rental!.baseAmount).toBe(2000);

        const extended = await rentalService.extendDueDate(String(rental!._id), daysFromNow(5));
        expect(extended.baseAmount).toBe(5000);
    });

    it('refuses to move the due date earlier', async () => {
        const customer = await makeCustomer();
        const item = await makeItem();
        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            dueDate: daysFromNow(5),
        });

        await expect(rentalService.extendDueDate(String(rental!._id), daysFromNow(2))).rejects.toThrow(
            /must be later/
        );
    });
});

describe('deleteRental', () => {
    it('releases inventory and detaches customer history', async () => {
        const customer = await makeCustomer();
        const item = await makeItem();
        const rental = await rentalService.createNewRental({
            customerId: String(customer._id),
            items: [{ itemId: String(item._id), quantity: 1 }],
            dueDate: daysFromNow(2),
        });

        await rentalService.deleteRental(String(rental!._id));

        expect((await Inventory.findById(item._id))!.status).toBe('Available');
        expect((await Customer.findById(customer._id))!.rentalHistory).toHaveLength(0);
        expect(await ProductRental.countDocuments()).toBe(0);
    });
});
