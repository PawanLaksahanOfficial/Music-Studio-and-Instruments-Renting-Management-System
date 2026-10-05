import type { CustomerRef, Invoice } from '@/types/api';

/** Everything an invoice document renders; built from a saved invoice or from a draft. */
export interface InvoiceDocumentData {
    invoiceId?: string;
    date: string;
    customer: CustomerRef | null;
    lines: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    issuedBy?: string;
    notes?: string;
    references?: string[];
    draft?: boolean;
}

export const invoiceToDocument = (invoice: Invoice): InvoiceDocumentData => ({
    invoiceId: invoice.invoiceId,
    date: invoice.createdAt,
    customer: invoice.customer,
    lines: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.totalAmount,
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.paymentStatus,
    issuedBy: invoice.createdBy?.name,
    notes: invoice.notes,
    references: [...invoice.productRentals.map(r => r.rentalId), ...invoice.studioRentals.map(b => b.bookingId)],
});
