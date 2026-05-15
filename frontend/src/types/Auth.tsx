export interface AuthUser {
    _id: string;
    name: string;
    username: string;
    role: 'Admin' | 'Cashier';
}

export interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCashier: boolean;
    loading: boolean;
}