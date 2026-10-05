import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Invoice, PaymentMethod, SimplePaymentStatus } from '@/types/api';
import { invalidate, keys } from './keys';

export interface CreateInvoiceInput {
    customerId: string;
    productRentalIds: string[];
    studioRentalIds: string[];
    items: { description: string; quantity: number; unitPrice: number }[];
    tax: number;
    paymentMethod: PaymentMethod;
    paymentStatus: SimplePaymentStatus;
    notes?: string;
}

export const useInvoices = () =>
    useQuery({ queryKey: [...keys.invoices, 'list'], queryFn: () => api.get<Invoice[]>('/invoices').then(r => r.data) });

const useInvoiceMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    // Invoice payments are mirrored onto the linked rentals and bookings.
    return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, keys.invoices, keys.rentals, keys.studio, keys.customers, keys.stats) });
};

export const useCreateInvoice = () => useInvoiceMutation((body: CreateInvoiceInput) => api.post<Invoice>('/invoices', body).then(r => r.data));
export const useUpdateInvoicePayment = () =>
    useInvoiceMutation(({ id, paymentStatus }: { id: string; paymentStatus: SimplePaymentStatus }) =>
        api.patch<Invoice>(`/invoices/${id}/payment`, { paymentStatus }).then(r => r.data));
