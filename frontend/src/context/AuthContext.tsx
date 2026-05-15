import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { AuthUser, AuthContextType } from '../types/Auth';

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: async () => {},
    logout: () => {},
    isAuthenticated: false,
    isAdmin: false,
    isCashier: false,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('elvi_token');
        const savedUser = localStorage.getItem('elvi_user');
        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);
                axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            } catch {
                localStorage.removeItem('elvi_token');
                localStorage.removeItem('elvi_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('elvi_token', newToken);
        localStorage.setItem('elvi_user', JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('elvi_token');
        localStorage.removeItem('elvi_user');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isAdmin: user?.role === 'Admin',
            isCashier: user?.role === 'Cashier',
            loading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);