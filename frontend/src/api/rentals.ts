import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Invoice, PaymentMethod, Rental, RentalPaymentStatus, ReturnQuote, SimplePaymentStatus } from '@/types/api';
import { invalidate, keys } from './keys';

export interface CreateRentalInput {
    customerId: string;
    itemIds: string[];
    rentalDate?: string;
    dueDate: string;
    paymentStatus: RentalPaymentStatus;
    paymentMethod?: PaymentMethod;
    notes?: string;
    invoice?: { paymentMethod: PaymentMethod; paymentStatus: SimplePaymentStatus; tax: number; notes?: string };
}

export interface ReturnRentalInput {
    returnDate: string;
    damageCharges: number;
    damageNotes?: string;
    damagedItemIds: string[];
    paymentStatus: RentalPaymentStatus;
    paymentMethod?: PaymentMethod;
    lateFeeOverride?: number;
}

const get = <T,>(url: string) => api.get<T>(url).then(r => r.data);

export const useRentals = () => useQuery({ queryKey: [...keys.rentals, 'list'], queryFn: () => get<Rental[]>('/rentals') });

export const useArchivedRentals = () =>
    useQuery({ queryKey: [...keys.rentals, 'archived'], queryFn: () => get<Rental[]>('/rentals/archived') });

export const useReturnQuote = (rentalId: string | undefined, returnDate: string) =>
    useQuery({
        queryKey: [...keys.rentals, rentalId, 'quote', returnDate],
        queryFn: () => api.get<ReturnQuote>(`/rentals/${rentalId}/return-quote`, { params: { returnDate } }).then(r => r.data),
        enabled: Boolean(rentalId && returnDate),
        placeholderData: previous => previous,
    });

/** Rental changes ripple into inventory status, invoices, customer profiles and statistics. */
const useRentalMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: () => invalidate(qc, keys.rentals, keys.inventory, keys.invoices, keys.customers, keys.stats),
    });
};

export const useCreateRental = () =>
    useRentalMutation((body: CreateRentalInput) => api.post<{ rental: Rental; invoice: Invoice | null }>('/rentals', body).then(r => r.data));

export const useUpdateRental = () =>
    useRentalMutation(({ id, ...body }: { id: string; paymentStatus?: RentalPaymentStatus; paymentMethod?: PaymentMethod; notes?: string }) =>
        api.patch<Rental>(`/rentals/${id}`, body).then(r => r.data));

export const useExtendRental = () =>
    useRentalMutation(({ id, newDueDate }: { id: string; newDueDate: string }) =>
        api.patch<Rental>(`/rentals/${id}/extend`, { newDueDate }).then(r => r.data));

export const useReturnRental = () =>
    useRentalMutation(({ id, ...body }: ReturnRentalInput & { id: string }) =>
        api.post<Rental>(`/rentals/${id}/return`, body).then(r => r.data));

export const useArchiveRental = () => useRentalMutation((id: string) => api.patch(`/rentals/${id}/archive`).then(r => r.data));
export const useRestoreRental = () => useRentalMutation((id: string) => api.patch(`/rentals/${id}/restore`).then(r => r.data));
export const useDeleteRental = () => useRentalMutation((id: string) => api.delete(`/rentals/${id}`).then(r => r.data));

/** Imperative lookups used by the QR flows (not cached: always the live state). */
export const fetchActiveRentalByQr = (code: string) =>
    get<Rental>(`/rentals/by-qr/${encodeURIComponent(code)}`);
