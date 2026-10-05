import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Role, User } from '@/types/api';
import { invalidate, keys } from './keys';

export interface UserInput {
    name: string;
    username?: string;
    email?: string;
    role: Role;
    password?: string;
}

export const useUsers = () => useQuery({ queryKey: [...keys.users, 'list'], queryFn: () => api.get<User[]>('/users').then(r => r.data) });

const useUserMutation = <TVars, TData>(fn: (vars: TVars) => Promise<TData>) => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, keys.users) });
};

export const useCreateUser = () => useUserMutation((body: UserInput) => api.post<User>('/users', body).then(r => r.data));
export const useUpdateUser = () =>
    useUserMutation(({ id, ...body }: Partial<UserInput> & { id: string }) => api.patch<User>(`/users/${id}`, body).then(r => r.data));
export const useToggleUserActive = () =>
    useUserMutation((id: string) => api.patch<{ isActive: boolean }>(`/users/${id}/toggle-active`).then(r => r.data));
export const useDeleteUser = () => useUserMutation((id: string) => api.delete(`/users/${id}`).then(r => r.data));
export const useSendLoginDetails = () =>
    useUserMutation((id: string) => api.post<{ message: string }>(`/users/${id}/send-login-details`).then(r => r.data));
