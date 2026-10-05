/**
 * Runs the API against a throwaway in-memory MongoDB (replica set, so transactions work),
 * seeded with sample data. Nothing touches your real database and no SMS/email is sent.
 *
 * Usage: npm run dev:demo      Sign in with admin / Demo1234 or cashier / Demo1234
 */
import { randomBytes } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { Types } from 'mongoose';

const DAY = 86_400_000;
const utcDay = (offset: number) => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
};
const at = (dayOffset: number, hour: number) => {
    const d = new Date(Date.now() + dayOffset * DAY);
    d.setHours(hour, 0, 0, 0);
    return d;
};

const main = async () => {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });

    // Set before config/env loads; dotenv never overrides existing variables.
    process.env.MONGO_URI = replSet.getUri('elvi_demo');
    process.env.JWT_SECRET = randomBytes(48).toString('base64');
    process.env.CRON_ENABLED = 'false';
    process.env.AWS_SES_FROM_EMAIL = '';
    process.env.AWS_ACCESS_KEY_ID = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';

    const { connectDB, disconnectDB } = await import('../config/db');
    const { default: User } = await import('../models/User');
    const { default: Customer } = await import('../models/Customer');
    const { default: Inventory } = await import('../models/Inventory');
    const { default: ProductRental } = await import('../models/ProductRental');
    const { default: StudioRental } = await import('../models/StudioRental');
    const { default: Invoice } = await import('../models/Invoice');
    const { nextDocumentNumber } = await import('../utils/sequence');

    await connectDB();

    const admin = await User.create({ name: 'Nadeesha Fernando', username: 'admin', email: 'admin@example.com', password: 'Demo1234', role: 'Admin' });
    await User.create({ name: 'Kasun Silva', username: 'cashier', email: 'cashier@example.com', password: 'Demo1234', role: 'Cashier' });
    await User.create({ name: 'Ishara Perera', username: 'ishara', password: 'Welcome123', role: 'Cashier', mustChangePassword: true });

    const customers = await Customer.create([
        { firstName: 'Amaya', lastName: 'Jayasinghe', phone: '0771234567', email: 'amaya@example.com', nicOrPassport: '199512345678', address: 'Colombo 05' },
        { firstName: 'Dilan', lastName: 'Wickramasinghe', phone: '0712223344', nicOrPassport: '985671234V' },
        { firstName: 'Tharushi', lastName: 'Gunawardena', phone: '0765558899', email: 'tharushi@example.com', nicOrPassport: 'N1234567' },
        { firstName: 'Ravindu', lastName: 'Bandara', phone: '0759990011', nicOrPassport: '200133445566', isBlacklisted: true },
        { firstName: 'Sahan', lastName: 'Rathnayake', phone: '0703334455', email: 'sahan@example.com', nicOrPassport: '199877665544' },
    ]);

    const items = await Inventory.create([
        { itemName: 'Fender Stratocaster', category: 'Instruments', brand: 'Fender', itemModel: 'Player II', serialNumber: 'MX21045871', qrCodeId: 'ELVI-1A2B3C4D', baseRentalPrice: 2500, purchaseDate: new Date('2024-03-10') },
        { itemName: 'Yamaha P-125 Digital Piano', category: 'Instruments', brand: 'Yamaha', itemModel: 'P-125', serialNumber: 'YP125-0042', qrCodeId: 'ELVI-5E6F7A8B', baseRentalPrice: 3500, notes: 'Includes stand and sustain pedal' },
        { itemName: 'Pearl Export Drum Kit', category: 'Instruments', brand: 'Pearl', itemModel: 'EXX725', serialNumber: 'PE-77812', qrCodeId: 'ELVI-9C0D1E2F', baseRentalPrice: 5000 },
        { itemName: 'Shure SM58', category: 'Audio Gear', brand: 'Shure', itemModel: 'SM58', serialNumber: 'SH58-11902', qrCodeId: 'ELVI-3A4B5C6D', baseRentalPrice: 600 },
        { itemName: 'Focusrite Scarlett 2i2', category: 'Audio Gear', brand: 'Focusrite', itemModel: '4th Gen', serialNumber: 'FS2I2-5531', qrCodeId: 'ELVI-7E8F9A0B', baseRentalPrice: 1200 },
        { itemName: 'Gibson Les Paul Standard', category: 'Instruments', brand: 'Gibson', itemModel: "'50s", serialNumber: 'GLP-220871', qrCodeId: 'ELVI-C1D2E3F4', baseRentalPrice: 4500, status: 'Damaged', notes: 'Cracked headstock — at repair shop' },
        { itemName: 'XLR Cable 10m', category: 'Cables', brand: 'Mogami', serialNumber: 'XLR-10-003', qrCodeId: 'ELVI-A5B6C7D8', baseRentalPrice: 150 },
        { itemName: 'Roland JC-120 Amp', category: 'Audio Gear', brand: 'Roland', itemModel: 'JC-120', serialNumber: 'RJC-88812', qrCodeId: 'ELVI-E9F0A1B2', baseRentalPrice: 2800, status: 'Maintenance' },
    ]);
    const [strat, piano, drums, sm58, scarlett, lesPaul] = items;

    const rental = async (opts: {
        customer: (typeof customers)[number]; itemList: (typeof items)[number][]; from: number; to: number;
        status?: 'Rented' | 'Overdue' | 'Returned'; returnedOffset?: number; lateFee?: number; damage?: number; paymentStatus?: 'Paid' | 'Pending' | 'Partial'; createdOffset?: number;
    }) => {
        const days = Math.max(1, opts.to - opts.from);
        const base = days * opts.itemList.reduce((s, i) => s + i.baseRentalPrice, 0);
        const doc = await ProductRental.create({
            rentalId: await nextDocumentNumber('PR'),
            customer: opts.customer._id,
            items: opts.itemList.map(i => ({ itemId: i._id, dailyRate: i.baseRentalPrice })),
            rentalDate: utcDay(opts.from),
            dueDate: utcDay(opts.to),
            returnDate: opts.returnedOffset !== undefined ? utcDay(opts.returnedOffset) : undefined,
            status: opts.status ?? 'Rented',
            baseAmount: base,
            lateFee: opts.lateFee ?? 0,
            damageCharges: opts.damage ?? 0,
            totalAmount: base + (opts.lateFee ?? 0) + (opts.damage ?? 0),
            paymentStatus: opts.paymentStatus ?? 'Pending',
            paymentMethod: 'Cash',
            createdBy: admin._id,
        });
        if (opts.createdOffset !== undefined) {
            await ProductRental.collection.updateOne({ _id: doc._id }, { $set: { createdAt: new Date(Date.now() + opts.createdOffset * DAY) } });
        }
        if (doc.status !== 'Returned') await Inventory.updateMany({ _id: { $in: opts.itemList.map(i => i._id) } }, { $set: { status: 'Rented' } });
        return doc;
    };

    await rental({ customer: customers[0], itemList: [strat], from: -2, to: 1 });
    await rental({ customer: customers[1], itemList: [drums, sm58], from: -6, to: -2, status: 'Overdue' });
    await rental({ customer: customers[2], itemList: [piano], from: 0, to: 0 });
    const returned1 = await rental({ customer: customers[0], itemList: [scarlett], from: -40, to: -35, status: 'Returned', returnedOffset: -33, lateFee: 2400, paymentStatus: 'Paid', createdOffset: -40 });
    await rental({ customer: customers[4], itemList: [lesPaul], from: -70, to: -65, status: 'Returned', returnedOffset: -65, damage: 15000, paymentStatus: 'Partial', createdOffset: -70 });
    await rental({ customer: customers[2], itemList: [sm58], from: -100, to: -97, status: 'Returned', returnedOffset: -97, paymentStatus: 'Paid', createdOffset: -100 });

    const booking = async (customer: (typeof customers)[number], roomName: string, day: number, start: number, end: number, amount: number, status: 'Confirmed' | 'Completed' = 'Confirmed', paymentStatus: 'Paid' | 'Pending' = 'Pending') =>
        StudioRental.create({ bookingId: await nextDocumentNumber('SR'), customer: customer._id, roomName, startTime: at(day, start), endTime: at(day, end), totalAmount: amount, status, paymentStatus, createdBy: admin._id });

    const pastSession = await booking(customers[4], 'Studio A', -12, 10, 14, 16000, 'Completed', 'Paid');
    await booking(customers[0], 'Studio A', 0, 15, 18, 12000);
    await booking(customers[2], 'Recording Booth', 1, 9, 12, 9000);
    await booking(customers[4], 'Studio B', 3, 18, 22, 14000);

    const invoice = async (customer: (typeof customers)[number], lines: { description: string; quantity: number; unitPrice: number; kind: 'product' | 'studio' | 'other' }[], paidOffset: number | null, links: { productRentals?: Types.ObjectId[]; studioRentals?: Types.ObjectId[] } = {}) => {
        const items = lines.map(l => ({ ...l, total: l.quantity * l.unitPrice }));
        const subtotal = items.reduce((s, l) => s + l.total, 0);
        const doc = await Invoice.create({
            invoiceId: await nextDocumentNumber('INV'), customer: customer._id, items, subtotal, tax: 0, totalAmount: subtotal,
            paymentMethod: 'Card', paymentStatus: paidOffset === null ? 'Pending' : 'Paid',
            paidAt: paidOffset === null ? undefined : new Date(Date.now() + paidOffset * DAY), createdBy: admin._id, ...links,
        });
        if (paidOffset !== null) await Invoice.collection.updateOne({ _id: doc._id }, { $set: { createdAt: new Date(Date.now() + paidOffset * DAY) } });
    };

    await invoice(customers[0], [{ description: `Focusrite Scarlett 2i2 — rental ${returned1.rentalId}`, quantity: 5, unitPrice: 1200, kind: 'product' }, { description: 'Late return fee', quantity: 1, unitPrice: 2400, kind: 'product' }], -33, { productRentals: [returned1._id] });
    await invoice(customers[4], [{ description: `Studio booking ${pastSession.bookingId} — Studio A (4h)`, quantity: 1, unitPrice: 16000, kind: 'studio' }], -12, { studioRentals: [pastSession._id] });
    await invoice(customers[2], [{ description: 'Guitar strings (set)', quantity: 3, unitPrice: 1800, kind: 'other' }], -55);
    await invoice(customers[2], [{ description: 'Shure SM58 — rental', quantity: 3, unitPrice: 600, kind: 'product' }, { description: 'Studio session — Studio C', quantity: 1, unitPrice: 10000, kind: 'studio' }], -95);
    await invoice(customers[1], [{ description: 'Drum kit + mic — deposit', quantity: 1, unitPrice: 8000, kind: 'product' }], null);

    console.log('\n  Demo data ready (in-memory database).');
    console.log('  Admin:   admin / Demo1234');
    console.log('  Cashier: cashier / Demo1234');
    console.log('  Forced password change: ishara / Welcome123\n');

    // server.ts opens its own connection.
    await disconnectDB();
    await import('../server');

    const stop = async () => { await replSet.stop(); process.exit(0); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
};

main().catch(err => {
    console.error('Demo failed to start:', err);
    process.exit(1);
});
