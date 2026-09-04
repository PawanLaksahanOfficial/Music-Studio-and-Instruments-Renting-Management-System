import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authAPI } from '../services/api';
import { tokenStore, setUnauthorizedHandler } from '../services/httpClient';
import type { AuthUser } from '../types/api';

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCashier: boolean;
    mustChangePassword: boolean;
    login: (username: string, password: string) => Promise<AuthUser>;
    logout: () => void;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
    }, []);

    // The http layer calls this when the server rejects our token, so a
    // revoked or expired session drops us to the login screen immediately.
    useEffect(() => {
        setUnauthorizedHandler(() => setUser(null));
    }, []);

    useEffect(() => {
        const restore = async () => {
            if (!tokenStore.get()) {
                setLoading(false);
                return;
            }
            try {
                // Re-validate against the server rather than trusting the user
                // object cached in localStorage, which a client can edit freely.
                setUser(await authAPI.me());
            } catch {
                tokenStore.clear();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        void restore();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const { token, user: authUser } = await authAPI.login(username, password);
        tokenStore.set(token);
        tokenStore.setUser(JSON.stringify(authUser));
        setUser(authUser);
        return authUser;
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        // The server rotates the token, since changing the password
        // invalidates every token issued before it — including ours.
        const { token, user: authUser } = await authAPI.changePassword(currentPassword, newPassword);
        tokenStore.set(token);
        tokenStore.setUser(JSON.stringify(authUser));
        setUser(authUser);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'Admin',
            isCashier: user?.role === 'Cashier',
            mustChangePassword: !!user?.mustChangePassword,
            login,
            logout,
            changePassword,
        }),
        [user, loading, login, logout, changePassword]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
    return ctx;
};
