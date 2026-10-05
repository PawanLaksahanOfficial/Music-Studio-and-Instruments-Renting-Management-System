import axios, { AxiosError, isAxiosError } from 'axios';

export interface ApiErrorBody {
    message?: string;
    code?: string;
    details?: { path: string; message: string }[];
    requestId?: string;
}

/**
 * Single HTTP client for the app. The session lives in an httpOnly cookie (never readable by
 * JavaScript), and every request carries the X-Requested-With header the API requires as a
 * CSRF guard. In development "/api" is proxied to the backend by Vite.
 */
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    withCredentials: true,
    timeout: 20_000,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

type AuthEvent = 'unauthorized' | 'password-change-required';
let authEventHandler: ((event: AuthEvent) => void) | undefined;

/** Lets the auth provider react to expired sessions and forced password changes. */
export const onAuthEvent = (handler: (event: AuthEvent) => void) => {
    authEventHandler = handler;
};

api.interceptors.response.use(
    response => response,
    (error: AxiosError<ApiErrorBody>) => {
        const status = error.response?.status;
        const isAuthCall = error.config?.url?.startsWith('/auth/');
        if (status === 401 && !isAuthCall) authEventHandler?.('unauthorized');
        if (status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') authEventHandler?.('password-change-required');
        return Promise.reject(error);
    },
);

/** A user-facing message for any error thrown by an API call. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
    if (isAxiosError<ApiErrorBody>(error)) {
        if (error.response?.data?.message) return error.response.data.message;
        if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
        if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
    }
    return error instanceof Error && error.message ? error.message : fallback;
};

export const getErrorStatus = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

export const getErrorCode = (error: unknown) =>
    isAxiosError<ApiErrorBody>(error) ? error.response?.data?.code : undefined;

export const getRequestId = (error: unknown) =>
    isAxiosError<ApiErrorBody>(error) ? error.response?.data?.requestId : undefined;
