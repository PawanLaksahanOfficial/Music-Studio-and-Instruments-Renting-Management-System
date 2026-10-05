import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Customer, CustomerProfile } from '@/types/api';
import { invalidate, keys } from './keys';

export interface CustomerInput {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    nicOrPassport: string;
}

const get = <T,>(url: string) => api.get<T>(url).then(r => r.data);

export const useCustomers = () => useQuery({ queryKey: [...keys.customers, 'list'], queryFn: () => get<Customer[]>('/customers') });
export const useArchivedCustomers = () => useQuery({ queryKey: [...keys.customers, 'archived'], queryFn: () => get<Customer[]>('/customers/archived') });
export const useCustomerProfile = (id: string | undefined) =>
    useQuery({ queryKey: [...keys.customers, id, 'profile'], queryFn: () => get<CustomerProfile>(`/customers/${id}/profile`), enabled: Boolean(id) });

const useCustomerMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, keys.customers, keys.stats) });
};

export const useCreateCustomer = () => useCustomerMutation((body: CustomerInput) => api.post<Customer>('/customers', body).then(r => r.data));
export const useUpdateCustomer = () =>
    useCustomerMutation(({ id, ...body }: Partial<CustomerInput> & { id: string }) => api.patch<Customer>(`/customers/${id}`, body).then(r => r.data));
export const useToggleBlacklist = () =>
    useCustomerMutation((id: string) => api.patch<{ isBlacklisted: boolean }>(`/customers/${id}/blacklist`).then(r => r.data));
export const useArchiveCustomer = () => useCustomerMutation((id: string) => api.patch(`/customers/${id}/archive`).then(r => r.data));
export const useRestoreCustomer = () => useCustomerMutation((id: string) => api.patch(`/customers/${id}/restore`).then(r => r.data));
export const useDeleteCustomer = () => useCustomerMutation((id: string) => api.delete(`/customers/${id}`).then(r => r.data));
