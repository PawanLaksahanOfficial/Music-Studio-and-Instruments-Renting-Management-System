/**
 * Realistic sample data for demos and screenshots: customers, inventory, ~5 months of rental
 * history (late returns, damage), rentals currently out, studio sessions and invoices.
 *
 * Only adds documents; nothing existing is changed or removed. Dates are relative to "today" in
 * APP_TIMEZONE, so the data always looks current. Emails use the reserved example.com domain.
 */
import { randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import Invoice from '../models/Invoice';
import { IInvoiceItem } from '../interfaces/IInvoice';
import { addDays, toDateOnly, today, zonedStartOfDay } from '../utils/dates';
import { nextDocumentNumber } from '../utils/sequence';

/** NIC of the first sample customer: its presence means the sample data is already loaded. */
const MARKER_NIC = '199512345678';

type PaymentMethod = 'Cash' | 'Card' | 'Transfer';

/** Calendar date `offset` days from today (stored as UTC midnight). */
const day = (offset: number) => addDays(today(), offset);

/** A real instant on day `offset` at hh:mm in the business timezone. */
const at = (offset: number, hour: number, minute = 0) =>
    new Date(zonedStartOfDay(toDateOnly(day(offset))).getTime() + (hour * 60 + minute) * 60_000);

/** Back-dates the automatic timestamps so history looks real. */
const backdate = <T>(model: Model<T>, id: Types.ObjectId, created: Date, updated: Date = created) =>
    model.collection.updateOne({ _id: id }, { $set: { createdAt: created, updatedAt: updated } });

const qrCode = () => `ELVI-${randomBytes(4).toString('hex').toUpperCase()}`;

export interface SampleDataSummary {
    skipped: boolean;
    customers: number;
    items: number;
    rentals: number;
    bookings: number;
    invoices: number;
}

export const loadSampleData = async ({ createdBy }: { createdBy: Types.ObjectId }): Promise<SampleDataSummary> => {
    if (await Customer.exists({ nicOrPassport: MARKER_NIC })) {
        return { skipped: true, customers: 0, items: 0, rentals: 0, bookings: 0, invoices: 0 };
    }

    // ── Customers ────────────────────────────────────────────────────────────
    const customerRows = [
        { firstName: 'Amaya', lastName: 'Jayasinghe', phone: '0771000101', email: 'amaya.j@example.com', nicOrPassport: MARKER_NIC, address: 'Colombo 05', joined: -160 },
        { firstName: 'Dilan', lastName: 'Wickramasinghe', phone: '0712000202', nicOrPassport: '875671234V', address: 'Kandy', joined: -150 },
        { firstName: 'Tharushi', lastName: 'Gunawardena', phone: '0763000303', email: 'tharushi.g@example.com', nicOrPassport: 'N1234567', joined: -140 },
        { firstName: 'Ravindu', lastName: 'Bandara', phone: '0754000404', nicOrPassport: '200133445566', isBlacklisted: true, joined: -130 },
        { firstName: 'Sahan', lastName: 'Rathnayake', phone: '0705000505', email: 'sahan.r@example.com', nicOrPassport: '199877665544', joined: -120 },
        { firstName: 'Nethmi', lastName: 'Senanayake', phone: '0776000606', email: 'nethmi.s@example.com', nicOrPassport: '200045612378', address: 'Nugegoda', joined: -100 },
        { firstName: 'Kavindu', lastName: 'Herath', phone: '0717000707', nicOrPassport: '951234567V', joined: -85 },
        { firstName: 'Ishini', lastName: 'Abeysekara', phone: '0768000808', email: 'ishini.a@example.com', nicOrPassport: '199965432187', joined: -60 },
        { firstName: 'Chamod', lastName: 'Liyanage', phone: '0749000909', nicOrPassport: '200212398765', address: 'Gampaha', joined: -40 },
        { firstName: 'Sanduni', lastName: 'Karunaratne', phone: '0771001010', email: 'sanduni.k@example.com', nicOrPassport: 'N7654321', joined: -20 },
    ];
    const customers = [];
    for (const { joined, ...row } of customerRows) {
        const customer = await Customer.create(row);
        await backdate(Customer, customer._id, at(joined, 11));
        customers.push(customer);
    }
    const [amaya, dilan, tharushi, ravindu, sahan, nethmi, kavindu, ishini, chamod, sanduni] = customers;

    // ── Inventory ────────────────────────────────────────────────────────────
    const itemRows = [
        { itemName: 'Fender Stratocaster', category: 'Instruments', brand: 'Fender', itemModel: 'Player II', serialNumber: 'MX21045871', baseRentalPrice: 2500, purchaseDate: new Date('2024-03-10') },
        { itemName: 'Gibson Les Paul Standard', category: 'Instruments', brand: 'Gibson', itemModel: "'50s", serialNumber: 'GLP220871', baseRentalPrice: 4500, purchaseDate: new Date('2023-11-02') },
        { itemName: 'Yamaha P-125 Digital Piano', category: 'Instruments', brand: 'Yamaha', itemModel: 'P-125', serialNumber: 'YP125-0042', baseRentalPrice: 3500, notes: 'Includes stand and sustain pedal' },
        { itemName: 'Roland FP-30X Digital Piano', category: 'Instruments', brand: 'Roland', itemModel: 'FP-30X', serialNumber: 'RFP30X-1187', baseRentalPrice: 3200 },
        { itemName: 'Pearl Export Drum Kit', category: 'Instruments', brand: 'Pearl', itemModel: 'EXX725', serialNumber: 'PE-77812', baseRentalPrice: 5000, notes: '5-piece with cymbals and throne' },
        { itemName: 'Roland TD-17KV Electronic Drums', category: 'Instruments', brand: 'Roland', itemModel: 'TD-17KV', serialNumber: 'RTD17-5521', baseRentalPrice: 4800 },
        { itemName: 'Ibanez SR300E Bass', category: 'Instruments', brand: 'Ibanez', itemModel: 'SR300E', serialNumber: 'IBSR-30992', baseRentalPrice: 2200 },
        { itemName: 'Taylor 214ce Acoustic Guitar', category: 'Instruments', brand: 'Taylor', itemModel: '214ce', serialNumber: 'TY214-6631', baseRentalPrice: 3000 },
        { itemName: 'Shure SM58 Microphone', category: 'Audio Gear', brand: 'Shure', itemModel: 'SM58', serialNumber: 'SH58-11902', baseRentalPrice: 600 },
        { itemName: 'Shure SM7B Microphone', category: 'Audio Gear', brand: 'Shure', itemModel: 'SM7B', serialNumber: 'SH7B-40213', baseRentalPrice: 1500 },
        { itemName: 'Focusrite Scarlett 2i2', category: 'Audio Gear', brand: 'Focusrite', itemModel: '4th Gen', serialNumber: 'FS2I2-5531', baseRentalPrice: 1200 },
        { itemName: 'Roland JC-120 Amplifier', category: 'Audio Gear', brand: 'Roland', itemModel: 'JC-120', serialNumber: 'RJC-88812', baseRentalPrice: 2800, notes: 'Scratchy volume pot — awaiting replacement part' },
        { itemName: 'Yamaha HS8 Studio Monitors (pair)', category: 'Audio Gear', brand: 'Yamaha', itemModel: 'HS8', serialNumber: 'YHS8-20931', baseRentalPrice: 2000 },
        { itemName: 'Boss Katana 50 Amplifier', category: 'Audio Gear', brand: 'Boss', itemModel: 'Katana-50 MkII', serialNumber: 'BK50-77120', baseRentalPrice: 1400 },
        { itemName: 'Mogami XLR Cable 10 m', category: 'Cables', brand: 'Mogami', itemModel: 'Gold Studio', serialNumber: 'XLR-10-003', baseRentalPrice: 150 },
        { itemName: 'Instrument Cable 6 m', category: 'Cables', brand: 'Fender', itemModel: 'Professional', serialNumber: 'JCK-06-011', baseRentalPrice: 100 },
    ] as const;
    const items = [];
    for (const row of itemRows) {
        const item = await Inventory.create({ ...row, qrCodeId: qrCode() });
        await backdate(Inventory, item._id, at(-170, 9));
        items.push(item);
    }
    const [strat, lesPaul, p125, fp30x, pearl, td17, ibanez, taylor, sm58, sm7b, scarlett, jc120, hs8, katana, xlr, jack] = items;
    type Item = (typeof items)[number];
    type Cust = (typeof customers)[number];

    let invoiceCount = 0;
    const createInvoice = async (opts: {
        customer: Cust; when: Date; lines: IInvoiceItem[]; method: PaymentMethod; paid: boolean; tax?: number;
        productRentals?: Types.ObjectId[]; studioRentals?: Types.ObjectId[]; notes?: string;
    }) => {
        const subtotal = opts.lines.reduce((s, l) => s + l.total, 0);
        const tax = opts.tax ?? 0;
        const invoice = await Invoice.create({
            invoiceId: await nextDocumentNumber('INV'),
            customer: opts.customer._id,
            productRentals: opts.productRentals ?? [],
            studioRentals: opts.studioRentals ?? [],
            items: opts.lines,
            subtotal,
            tax,
            totalAmount: subtotal + tax,
            paymentMethod: opts.method,
            paymentStatus: opts.paid ? 'Paid' : 'Pending',
            paidAt: opts.paid ? opts.when : undefined,
            createdBy,
            notes: opts.notes,
        });
        await backdate(Invoice, invoice._id, opts.when);
        invoiceCount += 1;
    };

    // ── Product rentals ──────────────────────────────────────────────────────
    let rentalCount = 0;
    const rent = async (opts: {
        customer: Cust; items: Item[]; from: number; days: number;
        lateBy?: number; damage?: number; active?: boolean;
        payment: 'Paid' | 'Pending' | 'Partial'; method: PaymentMethod; invoice?: 'paid' | 'pending' | 'none'; notes?: string;
    }) => {
        const dailyTotal = opts.items.reduce((s, i) => s + i.baseRentalPrice, 0);
        const baseAmount = opts.days * dailyTotal;
        const dueOffset = opts.from + opts.days;
        const returnOffset = opts.active ? undefined : dueOffset + (opts.lateBy ?? 0);
        const lateFee = (opts.lateBy ?? 0) * dailyTotal;
        const damage = opts.damage ?? 0;
        const overdue = opts.active && dueOffset < 0;

        const rental = await ProductRental.create({
            rentalId: await nextDocumentNumber('PR'),
            customer: opts.customer._id,
            items: opts.items.map(i => ({ itemId: i._id, quantity: 1, dailyRate: i.baseRentalPrice })),
            rentalDate: day(opts.from),
            dueDate: day(dueOffset),
            returnDate: returnOffset !== undefined ? day(returnOffset) : undefined,
            status: opts.active ? (overdue ? 'Overdue' : 'Rented') : 'Returned',
            baseAmount,
            lateFee,
            damageCharges: damage,
            damageNotes: damage ? 'Scratches and a cracked part found at check-in' : '',
            totalAmount: baseAmount + lateFee + damage,
            paymentStatus: opts.payment,
            paymentMethod: opts.method,
            notes: opts.notes,
            createdBy,
            returnedBy: opts.active ? undefined : createdBy,
        });
        const closedAt = returnOffset !== undefined ? at(returnOffset, 16) : at(opts.from, 10, 30);
        await backdate(ProductRental, rental._id, at(opts.from, 10, 30), closedAt);
        rentalCount += 1;

        if (opts.invoice && opts.invoice !== 'none') {
            const lines: IInvoiceItem[] = opts.items.map(i => ({
                description: `${i.itemName} (${i.serialNumber}) — rental ${rental.rentalId}`,
                quantity: opts.days, unitPrice: i.baseRentalPrice, total: opts.days * i.baseRentalPrice, kind: 'product',
            }));
            if (lateFee) lines.push({ description: `Late return fee — ${rental.rentalId}`, quantity: 1, unitPrice: lateFee, total: lateFee, kind: 'product' });
            if (damage) lines.push({ description: `Damage charges — ${rental.rentalId}`, quantity: 1, unitPrice: damage, total: damage, kind: 'product' });
            await createInvoice({
                customer: opts.customer, when: closedAt, lines, method: opts.method,
                paid: opts.invoice === 'paid', productRentals: [rental._id],
            });
        }
        return rental;
    };

    // History, oldest first so document numbers follow the timeline.
    await rent({ customer: amaya, items: [strat], from: -150, days: 4, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: dilan, items: [pearl, sm58], from: -142, days: 3, payment: 'Paid', method: 'Cash', invoice: 'paid', notes: 'Weekend gig' });
    await rent({ customer: tharushi, items: [p125], from: -135, days: 7, payment: 'Paid', method: 'Transfer', invoice: 'paid' });
    await rent({ customer: sahan, items: [ibanez], from: -128, days: 5, lateBy: 2, payment: 'Paid', method: 'Cash', invoice: 'paid' });
    await rent({ customer: nethmi, items: [scarlett, sm7b], from: -120, days: 3, payment: 'Paid', method: 'Card', invoice: 'paid', notes: 'Home podcast recording' });
    await rent({ customer: amaya, items: [taylor], from: -112, days: 6, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: kavindu, items: [td17], from: -104, days: 2, lateBy: 1, payment: 'Paid', method: 'Cash', invoice: 'paid' });
    await rent({ customer: ravindu, items: [strat], from: -98, days: 5, lateBy: 6, damage: 4000, payment: 'Partial', method: 'Cash', invoice: 'pending', notes: 'Returned late with a damaged output jack' });
    await rent({ customer: sahan, items: [lesPaul], from: -90, days: 5, damage: 15000, payment: 'Partial', method: 'Card', invoice: 'pending' });
    await rent({ customer: ishini, items: [hs8], from: -80, days: 4, payment: 'Paid', method: 'Transfer', invoice: 'paid' });
    await rent({ customer: tharushi, items: [sm58, xlr], from: -72, days: 2, payment: 'Paid', method: 'Cash', invoice: 'paid' });
    await rent({ customer: nethmi, items: [fp30x], from: -64, days: 10, lateBy: 3, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: chamod, items: [katana, jack], from: -55, days: 3, payment: 'Paid', method: 'Cash', invoice: 'paid' });
    await rent({ customer: dilan, items: [pearl], from: -46, days: 4, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: amaya, items: [scarlett], from: -38, days: 3, lateBy: 1, payment: 'Paid', method: 'Cash', invoice: 'paid' });
    await rent({ customer: sanduni, items: [taylor], from: -30, days: 5, payment: 'Paid', method: 'Transfer', invoice: 'paid' });
    await rent({ customer: ishini, items: [ibanez, katana], from: -22, days: 4, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: kavindu, items: [p125], from: -14, days: 5, lateBy: 2, payment: 'Pending', method: 'Cash', invoice: 'none' });
    await rent({ customer: nethmi, items: [sm7b], from: -9, days: 3, payment: 'Paid', method: 'Cash', invoice: 'paid' });

    // Currently out: one overdue, one due today, one tomorrow, two later.
    await rent({ customer: dilan, items: [td17, sm58], from: -6, days: 4, active: true, payment: 'Pending', method: 'Cash' });
    await rent({ customer: tharushi, items: [strat], from: -3, days: 3, active: true, payment: 'Partial', method: 'Card' });
    await rent({ customer: sahan, items: [hs8], from: -1, days: 2, active: true, payment: 'Paid', method: 'Transfer', invoice: 'paid' });
    await rent({ customer: chamod, items: [xlr, scarlett], from: -2, days: 6, active: true, payment: 'Paid', method: 'Card', invoice: 'paid' });
    await rent({ customer: sanduni, items: [fp30x], from: 0, days: 5, active: true, payment: 'Pending', method: 'Cash', notes: 'Wedding performance' });

    // Final inventory state: what's out, what's broken, what's being serviced.
    await Inventory.updateMany({ _id: { $in: [td17, sm58, strat, hs8, xlr, scarlett, fp30x].map(i => i._id) } }, { $set: { status: 'Rented' } });
    // Written directly so Mongoose doesn't overwrite the back-dated updatedAt.
    await Inventory.collection.updateOne({ _id: lesPaul._id }, { $set: { status: 'Damaged', notes: 'Cracked headstock — at the repair shop', updatedAt: at(-85, 16) } });
    await Inventory.collection.updateOne({ _id: jc120._id }, { $set: { status: 'Maintenance', lastMaintenance: day(-7), updatedAt: at(-7, 12) } });

    // ── Studio bookings ──────────────────────────────────────────────────────
    const ROOM_RATE: Record<string, number> = { 'Studio A': 4000, 'Studio B': 3500, 'Studio C': 3200, 'Recording Booth': 3000 };
    let bookingCount = 0;
    const book = async (opts: {
        customer: Cust; room: keyof typeof ROOM_RATE; dayOffset: number; start: number; end: number;
        status: 'Confirmed' | 'Completed' | 'Cancelled'; paid?: boolean; method?: PaymentMethod; notes?: string;
    }) => {
        const amount = (opts.end - opts.start) * ROOM_RATE[opts.room];
        const booking = await StudioRental.create({
            bookingId: await nextDocumentNumber('SR'),
            customer: opts.customer._id,
            roomName: opts.room,
            startTime: at(opts.dayOffset, opts.start),
            endTime: at(opts.dayOffset, opts.end),
            totalAmount: amount,
            status: opts.status,
            paymentStatus: opts.paid ? 'Paid' : 'Pending',
            notes: opts.notes,
            createdBy,
        });
        await backdate(StudioRental, booking._id, at(opts.dayOffset - 4, 12), at(opts.dayOffset, opts.end));
        bookingCount += 1;
        if (opts.status === 'Completed' && opts.paid) {
            await createInvoice({
                customer: opts.customer, when: at(opts.dayOffset, opts.end), method: opts.method ?? 'Card', paid: true,
                studioRentals: [booking._id],
                lines: [{ description: `Studio booking ${booking.bookingId} — ${opts.room} (${opts.end - opts.start}h)`, quantity: 1, unitPrice: amount, total: amount, kind: 'studio' }],
            });
        }
    };

    await book({ customer: tharushi, room: 'Studio A', dayOffset: -130, start: 10, end: 14, status: 'Completed', paid: true, notes: 'Band rehearsal' });
    await book({ customer: sahan, room: 'Recording Booth', dayOffset: -118, start: 18, end: 21, status: 'Completed', paid: true, method: 'Cash', notes: 'Vocal tracking' });
    await book({ customer: nethmi, room: 'Studio B', dayOffset: -96, start: 9, end: 12, status: 'Completed', paid: true, method: 'Transfer' });
    await book({ customer: amaya, room: 'Studio A', dayOffset: -75, start: 14, end: 18, status: 'Completed', paid: true, notes: 'EP recording session 1' });
    await book({ customer: ishini, room: 'Studio C', dayOffset: -61, start: 16, end: 19, status: 'Completed', paid: true, method: 'Cash' });
    await book({ customer: sanduni, room: 'Recording Booth', dayOffset: -44, start: 10, end: 13, status: 'Completed', paid: true, notes: 'Podcast episode' });
    await book({ customer: chamod, room: 'Studio B', dayOffset: -27, start: 19, end: 22, status: 'Completed', paid: true, method: 'Cash' });
    await book({ customer: dilan, room: 'Studio A', dayOffset: -12, start: 11, end: 15, status: 'Completed', paid: true, notes: 'Drum tracking' });
    await book({ customer: kavindu, room: 'Studio C', dayOffset: -5, start: 15, end: 17, status: 'Cancelled', notes: 'Cancelled by the customer' });
    await book({ customer: amaya, room: 'Studio A', dayOffset: 1, start: 10, end: 13, status: 'Confirmed', notes: 'EP recording session 2' });
    await book({ customer: nethmi, room: 'Recording Booth', dayOffset: 1, start: 18, end: 21, status: 'Confirmed' });
    await book({ customer: sahan, room: 'Studio B', dayOffset: 3, start: 14, end: 18, status: 'Confirmed', notes: 'Band rehearsal' });
    await book({ customer: ishini, room: 'Studio C', dayOffset: 6, start: 9, end: 12, status: 'Confirmed', paid: true });

    // ── Shop sales and services ──────────────────────────────────────────────
    const other = (description: string, quantity: number, unitPrice: number): IInvoiceItem =>
        ({ description, quantity, unitPrice, total: quantity * unitPrice, kind: 'other' });
    await createInvoice({ customer: amaya, when: at(-140, 15), method: 'Cash', paid: true, lines: [other('Guitar strings (set)', 3, 1800), other('Setup and restring service', 1, 2500)] });
    await createInvoice({ customer: kavindu, when: at(-100, 13), method: 'Cash', paid: true, lines: [other('Drumsticks (pair)', 2, 1200)] });
    await createInvoice({ customer: tharushi, when: at(-66, 17), method: 'Card', paid: true, lines: [other('Instrument cleaning and polish', 1, 2000)] });
    await createInvoice({ customer: ishini, when: at(-33, 12), method: 'Card', paid: true, lines: [other('Microphone pop filter', 1, 1500), other('Headphone extension cable', 2, 700)] });
    await createInvoice({ customer: nethmi, when: at(-8, 14), method: 'Cash', paid: true, lines: [other('Guitar strap', 1, 2200)] });

    return { skipped: false, customers: customers.length, items: items.length, rentals: rentalCount, bookings: bookingCount, invoices: invoiceCount };
};
