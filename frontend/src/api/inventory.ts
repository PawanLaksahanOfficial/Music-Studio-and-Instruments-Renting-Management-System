import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InventoryCategory, InventoryItem, InventoryStatus } from '@/types/api';
import { invalidate, keys } from './keys';

export interface InventoryInput {
    itemName: string;
    category: InventoryCategory;
    brand?: string;
    itemModel?: string;
    serialNumber?: string;
    status?: Exclude<InventoryStatus, 'Rented'>;
    baseRentalPrice: number;
    purchaseDate?: string;
    notes?: string;
}

const get = <T,>(url: string) => api.get<T>(url).then(r => r.data);

export const useInventory = () => useQuery({ queryKey: [...keys.inventory, 'list'], queryFn: () => get<InventoryItem[]>('/inventory') });
export const useDamagedInventory = () => useQuery({ queryKey: [...keys.inventory, 'damaged'], queryFn: () => get<InventoryItem[]>('/inventory/damaged') });
export const useArchivedInventory = () => useQuery({ queryKey: [...keys.inventory, 'archived'], queryFn: () => get<InventoryItem[]>('/inventory/archived') });

export const fetchInventoryByQr = (code: string) => get<InventoryItem>(`/inventory/qr/${encodeURIComponent(code)}`);

const useInventoryMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, keys.inventory, keys.stats) });
};

export const useCreateInventoryItem = () =>
    useInventoryMutation((body: InventoryInput) => api.post<InventoryItem>('/inventory', body).then(r => r.data));

export const useUpdateInventoryItem = () =>
    useInventoryMutation(({ id, ...body }: Partial<InventoryInput> & { id: string }) =>
        api.patch<InventoryItem>(`/inventory/${id}`, body).then(r => r.data));

export const useArchiveInventoryItem = () => useInventoryMutation((id: string) => api.patch(`/inventory/${id}/archive`).then(r => r.data));
export const useRestoreInventoryItem = () => useInventoryMutation((id: string) => api.patch(`/inventory/${id}/restore`).then(r => r.data));
export const useDeleteInventoryItem = () => useInventoryMutation((id: string) => api.delete(`/inventory/${id}`).then(r => r.data));
