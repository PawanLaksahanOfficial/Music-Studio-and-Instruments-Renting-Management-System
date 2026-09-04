import { describe, it, expect } from 'vitest';
import studioRentalService from '../services/studioRentalService';
import StudioRental from '../models/StudioRental';
import { makeCustomer, makeRoom } from './helpers';

const at = (hour: number, day = 1) => new Date(Date.UTC(2026, 5, day, hour, 0, 0));

describe('createStudioRental', () => {
    it('prices from the room hourly rate', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom({ hourlyRate: 2000 });

        const booking = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(14),
        });

        expect(booking!.durationHours).toBe(4);
        expect(booking!.totalAmount).toBe(8000);
        expect(booking!.bookingId).toMatch(/^SR-\d{6}$/);
    });

    it('captures the room name so a later rename does not rewrite history', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom({ name: 'Live Room A' });

        const booking = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(12),
        });

        expect(booking!.roomName).toBe('Live Room A');
    });

    it('rejects an overlapping booking for the same room', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(14),
        });

        await expect(
            studioRentalService.createStudioRental({
                customerId: String(customer._id),
                roomId: String(room._id),
                startTime: at(12),
                endTime: at(16),
            })
        ).rejects.toThrow(/already booked/);
    });

    it('allows back-to-back bookings that touch at the boundary', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(12),
        });

        // 12:00–14:00 starts exactly when the previous booking ends.
        const second = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(12),
            endTime: at(14),
        });

        expect(second).toBeTruthy();
    });

    it('allows the same slot in a different room', async () => {
        const customer = await makeCustomer();
        const [roomA, roomB] = await Promise.all([makeRoom(), makeRoom()]);

        await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(roomA._id),
            startTime: at(10),
            endTime: at(12),
        });

        const second = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(roomB._id),
            startTime: at(10),
            endTime: at(12),
        });

        expect(second).toBeTruthy();
    });

    it('rejects an end time at or before the start time', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        await expect(
            studioRentalService.createStudioRental({
                customerId: String(customer._id),
                roomId: String(room._id),
                startTime: at(14),
                endTime: at(10),
            })
        ).rejects.toThrow(/End time must be after start time/);
    });

    it('lets only one of two concurrent bookings for the same slot succeed', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        const attempt = () =>
            studioRentalService.createStudioRental({
                customerId: String(customer._id),
                roomId: String(room._id),
                startTime: at(10),
                endTime: at(12),
            });

        const results = await Promise.allSettled([attempt(), attempt()]);
        expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
        expect(await StudioRental.countDocuments()).toBe(1);
    });
});

describe('updateStudioRental', () => {
    it('re-checks for conflicts when the time window changes', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(12),
        });
        const second = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(14),
            endTime: at(16),
        });

        // Moving the second booking onto the first used to succeed silently,
        // because only creation checked for overlaps.
        await expect(
            studioRentalService.updateStudioRental(String(second!._id), {
                startTime: at(11),
                endTime: at(13),
            })
        ).rejects.toThrow(/already booked/);
    });

    it('re-prices when the window changes', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom({ hourlyRate: 1000 });

        const booking = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(12),
        });
        expect(booking!.totalAmount).toBe(2000);

        const updated = await studioRentalService.updateStudioRental(String(booking!._id), {
            endTime: at(15),
        });
        expect(updated!.totalAmount).toBe(5000);
    });

    it('does not treat an unchanged window as a conflict with itself', async () => {
        const customer = await makeCustomer();
        const room = await makeRoom();

        const booking = await studioRentalService.createStudioRental({
            customerId: String(customer._id),
            roomId: String(room._id),
            startTime: at(10),
            endTime: at(12),
        });

        const updated = await studioRentalService.updateStudioRental(String(booking!._id), {
            notes: 'Bring a spare cable',
        });
        expect(updated!.notes).toBe('Bring a spare cable');
    });
});
