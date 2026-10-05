import { Types } from 'mongoose';
import { z } from 'zod';
import Invoice from '../models/Invoice';
import Customer from '../models/Customer';
import ProductRental from '../models/ProductRental';
import StudioRental from '../models/StudioRental';
import { IInvoiceItem } from '../interfaces/IInvoice';
import { AuthUser } from '../interfaces/IUser';
import { badRequest, conflict, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { roundMoney, sumMoney } from '../utils/money';
import { rentalDays } from '../utils/dates';
import { nextDocumentNumber } from '../utils/sequence';
import { withTransaction } from '../utils/transaction';
import { createInvoiceBody } from '../validators/invoice';

export type CreateInvoiceInput = z.infer<typeof createInvoiceBody>;

interface PopulatedRentalItem {
    itemId: { itemName?: string; serialNumber?: string; baseRentalPrice?: number } | null;
    dailyRate?: number;
}

interface RentalForLines {
    rentalId: string;
    rentalDate: Date;
    dueDate: Date;
    baseAmount?: number;
    totalAmount: number;
    lateFee?: number;
    damageCharges?: number;
    items: PopulatedRentalItem[];
}

const truncate = (text: string, max = 200) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Itemized invoice lines for a product rental, built from server-side data only. */
export const buildRentalLines = (rental: RentalForLines): IInvoiceItem[] => {
    const itemized = rental.baseAmount != null && rental.items.every(i => i.dailyRate != null);
    if (!itemized) {
        // Rentals created before per-item rates were stored: bill the recorded total as one line.
        const names = rental.items.map(i => i.itemId?.itemName).filter(Boolean).join(', ');
        return [{
            description: truncate(`Instrument rental ${rental.rentalId}${names ? ` — ${names}` : ''}`),
            quantity: 1,
            unitPrice: rental.totalAmount,
            total: rental.totalAmount,
            kind: 'product',
        }];
    }

    const days = rentalDays(rental.rentalDate, rental.dueDate);
    const lines: IInvoiceItem[] = rental.items.map(item => ({
        description: truncate(`${item.itemId?.itemName ?? 'Item'}${item.itemId?.serialNumber ? ` (${item.itemId.serialNumber})` : ''} — rental ${rental.rentalId}`),
        quantity: days,
        unitPrice: item.dailyRate!,
        total: roundMoney(days * item.dailyRate!),
        kind: 'product',
    }));
    if (rental.lateFee) {
        lines.push({ description: `Late return fee — ${rental.rentalId}`, quantity: 1, unitPrice: rental.lateFee, total: rental.lateFee, kind: 'product' });
    }
    if (rental.damageCharges) {
        lines.push({ description: `Damage charges — ${rental.rentalId}`, quantity: 1, unitPrice: rental.damageCharges, total: rental.damageCharges, kind: 'product' });
    }
    return lines;
};

const populateInvoice = (id: Types.ObjectId | string) =>
    Invoice.findById(id)
        .populate('customer', 'firstName lastName phone email')
        .populate('productRentals', 'rentalId')
        .populate('studioRentals', 'bookingId roomName')
        .populate('createdBy', 'name')
        .lean();

class InvoiceService {
    list() {
        return Invoice.find()
            .populate('customer', 'firstName lastName phone email')
            .populate('productRentals', 'rentalId')
            .populate('studioRentals', 'bookingId roomName')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getById(id: string | Types.ObjectId) {
        const invoice = await populateInvoice(id);
        if (!invoice) throw notFound('Invoice');
        return invoice;
    }

    async create(input: CreateInvoiceInput, actor: AuthUser) {
        const invoiceId = await withTransaction(() => this.createInCurrentTransaction(input, actor));
        return this.getById(invoiceId);
    }

    /**
     * Creates an invoice; must be called inside withTransaction(). Amounts are always computed here:
     * linked rentals are billed from their stored totals and manual lines from quantity x unit price.
     */
    async createInCurrentTransaction(input: CreateInvoiceInput, actor: AuthUser): Promise<Types.ObjectId> {
        const { customerId, productRentalIds, studioRentalIds } = input;

        if (!(await Customer.exists({ _id: customerId }))) throw notFound('Customer');

        // Sequential on purpose: operations inside one transaction must not run in parallel.
        const productRentals = productRentalIds.length
            ? await ProductRental.find({ _id: { $in: productRentalIds }, isDeleted: false })
                .populate('items.itemId', 'itemName serialNumber baseRentalPrice')
                .lean()
            : [];
        const studioRentals = studioRentalIds.length
            ? await StudioRental.find({ _id: { $in: studioRentalIds }, isDeleted: false }).lean()
            : [];
        if (productRentals.length !== productRentalIds.length) throw notFound('One or more linked rentals');
        if (studioRentals.length !== studioRentalIds.length) throw notFound('One or more linked studio bookings');

        const linked = [...productRentals, ...studioRentals];
        if (linked.some(r => r.customer.toString() !== customerId)) {
            throw badRequest('Linked rentals and bookings must belong to the selected customer');
        }

        if (linked.length) {
            const existing = await Invoice.findOne({
                $or: [{ productRentals: { $in: productRentalIds } }, { studioRentals: { $in: studioRentalIds } }],
            }).select('invoiceId').lean();
            if (existing) throw conflict(`A selected rental or booking is already billed on invoice ${existing.invoiceId}`);
        }

        const lines: IInvoiceItem[] = [
            ...productRentals.flatMap(r => buildRentalLines(r as unknown as RentalForLines)),
            ...studioRentals.map(b => ({
                description: truncate(`Studio booking ${b.bookingId} — ${b.roomName}${b.durationHours ? ` (${b.durationHours}h)` : ''}`),
                quantity: 1,
                unitPrice: b.totalAmount,
                total: b.totalAmount,
                kind: 'studio' as const,
            })),
            ...input.items.map(line => ({
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                total: roundMoney(line.quantity * line.unitPrice),
                kind: 'other' as const,
            })),
        ];

        const subtotal = sumMoney(lines.map(l => l.total));
        const isPaid = input.paymentStatus === 'Paid';
        const invoice = await Invoice.create({
            invoiceId: await nextDocumentNumber('INV'),
            customer: customerId,
            productRentals: productRentalIds,
            studioRentals: studioRentalIds,
            items: lines,
            subtotal,
            tax: input.tax,
            totalAmount: roundMoney(subtotal + input.tax),
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentStatus,
            paidAt: isPaid ? new Date() : undefined,
            createdBy: actor.id,
            notes: input.notes,
        });

        if (isPaid) await this.markLinkedRentalsPaid(productRentalIds, studioRentalIds);

        logger.info({ event: 'invoice.created', invoiceId: invoice.invoiceId, total: invoice.totalAmount, by: actor.id }, 'Invoice created');
        return invoice._id;
    }

    async updatePayment(id: string, paymentStatus: 'Paid' | 'Pending', actor: AuthUser) {
        await withTransaction(async () => {
            const invoice = await Invoice.findById(id);
            if (!invoice) throw notFound('Invoice');

            const wasPaid = invoice.paymentStatus === 'Paid';
            invoice.paymentStatus = paymentStatus;
            if (paymentStatus === 'Paid' && !wasPaid) invoice.paidAt = new Date();
            if (paymentStatus === 'Pending') invoice.paidAt = undefined;
            await invoice.save();

            if (paymentStatus === 'Paid') {
                await this.markLinkedRentalsPaid(invoice.productRentals, invoice.studioRentals);
            }
            logger.info({ event: 'invoice.payment_updated', invoiceId: invoice.invoiceId, paymentStatus, by: actor.id }, 'Invoice payment status changed');
        });
        return this.getById(id);
    }

    private async markLinkedRentalsPaid(productRentalIds: (string | Types.ObjectId)[], studioRentalIds: (string | Types.ObjectId)[]) {
        if (productRentalIds.length) {
            await ProductRental.updateMany({ _id: { $in: productRentalIds } }, { $set: { paymentStatus: 'Paid' } });
        }
        if (studioRentalIds.length) {
            await StudioRental.updateMany({ _id: { $in: studioRentalIds } }, { $set: { paymentStatus: 'Paid' } });
        }
    }
}

export default new InvoiceService();
