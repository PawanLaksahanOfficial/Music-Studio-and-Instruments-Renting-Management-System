import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { STUDIO_ROOMS } from '@/lib/constants';
import type { SimplePaymentStatus, StudioBooking, StudioStatus } from '@/types/api';
import { invalidate, keys } from './keys';

export interface StudioBookingInput {
    customerId: string;
    roomName: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    status: StudioStatus;
    paymentStatus: SimplePaymentStatus;
    notes?: string;
}

const get = <T,>(url: string) => api.get<T>(url).then(r => r.data);

export const useStudioBookings = () => useQuery({ queryKey: [...keys.studio, 'list'], queryFn: () => get<StudioBooking[]>('/studio-rentals') });
export const useArchivedStudioBookings = () => useQuery({ queryKey: [...keys.studio, 'archived'], queryFn: () => get<StudioBooking[]>('/studio-rentals/archived') });
export const useStudioRooms = () =>
    useQuery({
        queryKey: [...keys.studio, 'rooms'],
        queryFn: () => get<string[]>('/studio-rentals/rooms'),
        staleTime: Infinity,
        placeholderData: [...STUDIO_ROOMS],
    });

const useStudioMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, keys.studio, keys.invoices, keys.stats) });
};

export const useCreateStudioBooking = () =>
    useStudioMutation((body: StudioBookingInput) => api.post<StudioBooking>('/studio-rentals', body).then(r => r.data));
export const useUpdateStudioBooking = () =>
    useStudioMutation(({ id, ...body }: Partial<StudioBookingInput> & { id: string }) => api.patch<StudioBooking>(`/studio-rentals/${id}`, body).then(r => r.data));
export const useArchiveStudioBooking = () => useStudioMutation((id: string) => api.patch(`/studio-rentals/${id}/archive`).then(r => r.data));
export const useRestoreStudioBooking = () => useStudioMutation((id: string) => api.patch(`/studio-rentals/${id}/restore`).then(r => r.data));
export const useDeleteStudioBooking = () => useStudioMutation((id: string) => api.delete(`/studio-rentals/${id}`).then(r => r.data));
