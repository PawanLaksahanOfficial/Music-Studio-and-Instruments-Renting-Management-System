import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorStatus, onAuthEvent } from '@/lib/api';
import { keys } from '@/api/keys';
import type { AuthUser } from '@/types/api';

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    /** The session check failed for a reason other than "not signed in" (e.g. server offline). */
    error: unknown;
    isAdmin: boolean;
    login: (username: string, password: string) => Promise<AuthUser>;
    logout: () => Promise<void>;
    setUser: (user: AuthUser) => void;
    retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const fetchMe = async (): Promise<AuthUser | null> => {
    try {
        return (await api.get<AuthUser>('/auth/me')).data;
    } catch (error) {
        if (getErrorStatus(error) === 401) return null;
        throw error;
    }
};

/**
 * The session lives in an httpOnly cookie; the app only asks the API who is signed in.
 * Nothing about the session is stored in localStorage.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const qc = useQueryClient();
    const me = useQuery({ queryKey: keys.me, queryFn: fetchMe, staleTime: 5 * 60_000, retry: 1 });

    useEffect(() => {
        onAuthEvent(event => {
            if (event === 'unauthorized') {
                qc.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' });
                qc.setQueryData(keys.me, null);
            } else {
                qc.setQueryData<AuthUser | null>(keys.me, current => (current ? { ...current, mustChangePassword: true } : current));
            }
        });
    }, [qc]);

    const login = useCallback(async (username: string, password: string) => {
        const { data } = await api.post<{ user: AuthUser }>('/auth/login', { username, password });
        qc.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' });
        qc.setQueryData(keys.me, data.user);
        return data.user;
    }, [qc]);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            qc.clear();
            qc.setQueryData(keys.me, null);
        }
    }, [qc]);

    const setUser = useCallback((user: AuthUser) => qc.setQueryData(keys.me, user), [qc]);

    const user = me.data ?? null;
    const value = useMemo<AuthContextValue>(() => ({
        user,
        isLoading: me.isPending,
        error: me.isError ? me.error : null,
        isAdmin: user?.role === 'Admin',
        login,
        logout,
        setUser,
        retry: () => void me.refetch(),
    }), [user, me, login, logout, setUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
