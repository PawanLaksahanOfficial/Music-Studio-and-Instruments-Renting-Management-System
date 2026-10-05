import { QueryClient } from '@tanstack/react-query';
import { getErrorStatus } from './api';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            // Retry network blips and server errors, never 4xx responses.
            retry: (failureCount, error) => {
                const status = getErrorStatus(error);
                return failureCount < 2 && (status === undefined || status >= 500);
            },
        },
        mutations: { retry: false },
    },
});
