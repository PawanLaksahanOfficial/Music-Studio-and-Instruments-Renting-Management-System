import axios, { AxiosError } from 'axios';

/**
 * A dedicated axios instance rather than the global default.
 *
 * The base URL comes from the environment, so a production build points at the
 * deployed API instead of the hard-coded localhost the app previously shipped
 * with. Mutating `axios.defaults` also leaked the auth header onto every third
 * party request the app might ever make.
 */
export const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
    timeout: 20_000,
    headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'elvi_token';
const USER_KEY = 'elvi_user';

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    getUser: () => localStorage.getItem(USER_KEY),
    setUser: (json: string) => localStorage.setItem(USER_KEY, json),
};

http.interceptors.request.use(config => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/** Called when the server rejects our token, so the app can send us to /login. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
    onUnauthorized = fn;
};

export interface ApiErrorDetail {
    path: string;
    message: string;
}

/** Normalised error, so callers never dig through `err.response.data` themselves. */
export class ApiError extends Error {
    readonly status: number;
    readonly details?: ApiErrorDetail[];

    constructor(message: string, status: number, details?: ApiErrorDetail[]) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }

    /** Field-keyed messages, for rendering errors inline next to inputs. */
    get fieldErrors(): Record<string, string> {
        return Object.fromEntries((this.details ?? []).map(d => [d.path, d.message]));
    }
}

interface ServerErrorBody {
    message?: string;
    details?: ApiErrorDetail[];
}

http.interceptors.response.use(
    response => response,
    (error: AxiosError<ServerErrorBody>) => {
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new ApiError('The request timed out. Check your connection.', 0));
        }
        if (!error.response) {
            return Promise.reject(new ApiError('Cannot reach the server. Check your connection.', 0));
        }

        const { status, data } = error.response;

        // An expired or revoked token: clear it and let the app redirect once,
        // rather than every page handling 401 in its own way.
        if (status === 401 && tokenStore.get()) {
            tokenStore.clear();
            onUnauthorized?.();
        }

        return Promise.reject(new ApiError(data?.message ?? 'Something went wrong', status, data?.details));
    }
);

/** Message suitable for showing a user, from any thrown value. */
export const errorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return 'Something went wrong';
};
