import type { QueryClient } from '@tanstack/react-query';

/** Query key roots. Mutations invalidate every root whose data they can change. */
export const keys = {
    me: ['auth', 'me'] as const,
    users: ['users'] as const,
    customers: ['customers'] as const,
    inventory: ['inventory'] as const,
    rentals: ['rentals'] as const,
    studio: ['studio'] as const,
    invoices: ['invoices'] as const,
    stats: ['stats'] as const,
};

export const invalidate = (qc: QueryClient, ...roots: (readonly string[])[]) =>
    Promise.all(roots.map(queryKey => qc.invalidateQueries({ queryKey })));
