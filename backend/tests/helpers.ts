import mongoose from 'mongoose';
import User from '../models/User';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import Room from '../models/Room';
import authService from '../services/authService';

let serial = 0;

export const makeUser = async (overrides: Partial<Record<string, unknown>> = {}) => {
    serial++;
    return User.create({
        name: 'Test User',
        username: `user${serial}`,
        password: 'CorrectHorse9',
        role: 'Admin',
        isActive: true,
        ...overrides,
    });
};

export const makeCustomer = async (overrides: Partial<Record<string, unknown>> = {}) => {
    serial++;
    return Customer.create({
        firstName: 'Nimal',
        lastName: 'Perera',
        phone: '+94771234567',
        nicOrPassport: `NIC${serial}`,
        ...overrides,
    });
};

export const makeItem = async (overrides: Partial<Record<string, unknown>> = {}) => {
    serial++;
    return Inventory.create({
        itemName: 'Fender Stratocaster',
        category: 'Instruments',
        serialNumber: `SN-${serial}`,
        qrCodeId: `ELVI-${serial}`,
        baseRentalPrice: 1000,
        status: 'Available',
        ...overrides,
    });
};

export const makeRoom = async (overrides: Partial<Record<string, unknown>> = {}) => {
    serial++;
    return Room.create({ name: `Room ${serial}`, hourlyRate: 2000, isActive: true, ...overrides });
};

export const tokenFor = (user: Parameters<typeof authService.signToken>[0]) => authService.signToken(user);

export const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(12, 0, 0, 0);
    return d;
};

export const id = (value: unknown) => new mongoose.Types.ObjectId(String(value));
