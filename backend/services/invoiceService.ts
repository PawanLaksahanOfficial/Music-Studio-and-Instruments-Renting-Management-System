import { Types } from 'mongoose';
import Invoice from '../models/Invoice';
import StudioRental from '../models/StudioRental';
import ProductRental from '../models/ProductRental';
import Customer from '../models/Customer';
import { nextSequence, formatId } from '../models/Counter';
import { IInvoice, IInvoiceItem } from '../interfaces/IInvoice';
import { badRequest, notFound } from '../utils/AppError';
import { withTransaction } from '../utils/transaction';
import { paginate, searchFilter, Paginated } from '../utils/paginate';
import { totalInvoice, round2 } from '../utils/pricing';

const POPULATE = [
    { path: 'customer', select: 'firstName lastName phone email nicOrPassport' },
    { path: 'productRentals', select: 'rentalId' },
    { path: 'studioRentals', select: 'bookingId roomName' },
    { path: 'createdBy', select: 'name' },
];

interface CreateInvoiceInput {
    customerId: string;
    productRentalIds?: string[];
    studioRentalIds?: string[];
    /** Ad-hoc lines only. Rental lines are built server-side from the linked records. */
    manualItems?: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    paymentMethod: 'Cash' | 'Card' | 'Transfer';
    paymentStatus?: 'Paid' | 'Pending';
    notes?: string;
}

class InvoiceService {
    async getAllInvoices(opts: { page: number; limit: number; search?: string; paymentStatus?: string }): Promise<Paginated<IInvoice>> {
        const filter: Record<string, unknown> = {};
        if (opts.paymentStatus && opts.paymentStatus !== 'All') filter.paymentStatus = opts.paymentStatus;
        if (opts.search) Object.assign(filter, searchFilter(opts.search, ['invoiceId']));

        return paginate(Invoice, {
            filter,
            page: opts.page,
            limit: opts.limit,
            sort: { createdAt: -1 },
            populate: POPULATE,
        });
    }

    async getInvoiceById(id: string): Promise<IInvoice> {
        const invoice = await Invoice.findById(id).populate(POPULATE);
        if (!invoice) throw notFound('Invoice not found');
        return invoice;
    }

    /**
     * Builds the invoice server-side. Rental lines are generated from the
     * linked records' own stored amounts and the totals are recomputed here,
     * so a client cannot post its own `subtotal`, `tax` or `totalAmount`.
     */
    async createInvoice(input: CreateInvoiceInput, createdBy: string): Promise<IInvoice | null> {
        const productIds = input.productRentalIds ?? [];
        const studioIds = input.studioRentalIds ?? [];
        const manual = input.manualItems ?? [];

        if (!productIds.length && !studioIds.length && !manual.length) {
            throw badRequest('An invoice needs at least one rental or one line item');
        }

        const invoiceId = await withTransaction(async session => {
            const customer = await Customer.findById(input.customerId).session(session);
            if (!customer) throw notFound('Customer not found');

            const [productRentals, studioRentals] = await Promise.all([
                ProductRental.find({ _id: { $in: productIds }, isDeleted: false }).session(session),
                StudioRental.find({ _id: { $in: studioIds }, isDeleted: false }).session(session),
            ]);
            if (productRentals.length !== productIds.length) throw notFound('One or more product rentals do not exist');
            if (studioRentals.length !== studioIds.length) throw notFound('One or more studio bookings do not exist');

            const mismatched = [...productRentals, ...studioRentals].filter(
                r => String(r.customer) !== String(input.customerId)
            );
            if (mismatched.length) throw badRequest('Every rental on an invoice must belong to the same customer');

            const items: IInvoiceItem[] = [
                ...productRentals.map(r => ({
                    description: `Product Rental ${r.rentalId}`,
                    quantity: 1,
                    unitPrice: r.totalAmount,
                    total: r.totalAmount,
                    sourceType: 'ProductRental' as const,
                    sourceId: r._id as Types.ObjectId,
                })),
                ...studioRentals.map(r => ({
                    description: `Studio Booking ${r.bookingId} — ${r.roomName}`,
                    quantity: 1,
                    unitPrice: r.totalAmount,
                    total: r.totalAmount,
                    sourceType: 'StudioRental' as const,
                    sourceId: r._id as Types.ObjectId,
                })),
                ...manual.map(m => ({
                    description: m.description,
                    quantity: m.quantity,
                    unitPrice: m.unitPrice,
                    total: round2(m.quantity * m.unitPrice),
                    sourceType: 'Manual' as const,
                })),
            ];

            const taxRate = input.taxRate ?? 0;
            const { subtotal, tax, totalAmount } = totalInvoice(items, taxRate);
            const paymentStatus = input.paymentStatus ?? 'Pending';
            const seq = await nextSequence('invoice', session);

            const [invoice] = await Invoice.create(
                [
                    {
                        invoiceId: formatId('INV', seq),
                        customer: input.customerId,
                        productRentals: productIds,
                        studioRentals: studioIds,
                        items,
                        subtotal,
                        taxRate,
                        tax,
                        totalAmount,
                        paymentMethod: input.paymentMethod,
                        paymentStatus,
                        paidAt: paymentStatus === 'Paid' ? new Date() : undefined,
                        createdBy,
                        notes: input.notes,
                    },
                ],
                { session }
            );

            if (paymentStatus === 'Paid') {
                await this.syncRentalPayments(productIds, studioIds, session);
            }
            return invoice._id;
        });

        return Invoice.findById(invoiceId).populate(POPULATE);
    }

    async updatePaymentStatus(id: string, paymentStatus: 'Paid' | 'Pending'): Promise<IInvoice | null> {
        const invoiceId = await withTransaction(async session => {
            const invoice = await Invoice.findById(id).session(session);
            if (!invoice) throw notFound('Invoice not found');

            invoice.paymentStatus = paymentStatus;
            // paidAt is what monthly revenue buckets by, so it must track the
            // status rather than being inferred from updatedAt.
            invoice.paidAt = paymentStatus === 'Paid' ? new Date() : undefined;
            await invoice.save({ session });

            if (paymentStatus === 'Paid') {
                await this.syncRentalPayments(
                    invoice.productRentals.map(String),
                    invoice.studioRentals.map(String),
                    session
                );
            }
            return invoice._id;
        });

        return Invoice.findById(invoiceId).populate(POPULATE);
    }

    private async syncRentalPayments(productIds: string[], studioIds: string[], session: import('mongoose').ClientSession) {
        if (productIds.length) {
            await ProductRental.updateMany(
                { _id: { $in: productIds } },
                { $set: { paymentStatus: 'Paid' } },
                { session }
            );
        }
        if (studioIds.length) {
            await StudioRental.updateMany(
                { _id: { $in: studioIds } },
                { $set: { paymentStatus: 'Paid' } },
                { session }
            );
        }
    }

    /** Unbilled rentals for a customer — what the invoice form offers to add. */
    async getBillableForCustomer(customerId: string) {
        const invoiced = await Invoice.find({ customer: customerId }).select('productRentals studioRentals').lean();
        const billedProduct = new Set(invoiced.flatMap(i => i.productRentals.map(String)));
        const billedStudio = new Set(invoiced.flatMap(i => i.studioRentals.map(String)));

        const [productRentals, studioRentals] = await Promise.all([
            ProductRental.find({ customer: customerId, isDeleted: false }).select('rentalId totalAmount status dueDate').lean(),
            StudioRental.find({ customer: customerId, isDeleted: false }).select('bookingId roomName totalAmount status startTime').lean(),
        ]);

        return {
            productRentals: productRentals.filter(r => !billedProduct.has(String(r._id))),
            studioRentals: studioRentals.filter(r => !billedStudio.has(String(r._id))),
        };
    }
}

export default new InvoiceService();
