import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { errorMessage } from '../services/httpClient';
import type { ListParams, Paginated } from '../types/api';

interface Options {
    limit?: number;
    /** Milliseconds to wait after typing stops before querying. */
    searchDelay?: number;
}

interface Result<T> {
    items: T[];
    meta: Paginated<T>['meta'] | null;
    loading: boolean;
    error: string | null;
    page: number;
    search: string;
    filters: Record<string, string>;
    setPage: (page: number) => void;
    setSearch: (search: string) => void;
    setFilter: (key: string, value: string) => void;
    refresh: () => void;
}

interface QueryState<T> {
    items: T[];
    meta: Paginated<T>['meta'] | null;
    loading: boolean;
    error: string | null;
}

type QueryAction<T> =
    | { type: 'start' }
    | { type: 'success'; items: T[]; meta: Paginated<T>['meta'] }
    | { type: 'error'; message: string };

// A reducer, rather than three separate useState calls, so the fetch effect
// below drives its lifecycle through one dispatch instead of several
// sequential setState calls in the same synchronous pass.
const queryReducer = <T,>(state: QueryState<T>, action: QueryAction<T>): QueryState<T> => {
    switch (action.type) {
        case 'start':
            return { ...state, loading: true, error: null };
        case 'success':
            return { items: action.items, meta: action.meta, loading: false, error: null };
        case 'error':
            return { items: [], meta: null, loading: false, error: action.message };
    }
};

/**
 * Server-side list state: paging, debounced search and filters.
 *
 * Search and filtering happen in the database rather than over a fully
 * downloaded collection, so the browser never has to hold the whole dataset.
 */
export const usePagedQuery = <T>(
    fetcher: (params: ListParams) => Promise<Paginated<T>>,
    { limit = 25, searchDelay = 300 }: Options = {}
): Result<T> => {
    const [{ items, meta, loading, error }, dispatch] = useReducer(queryReducer<T>, {
        items: [],
        meta: null,
        loading: true,
        error: null,
    });
    const [page, setPage] = useState(1);
    const [search, setSearchRaw] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [nonce, setNonce] = useState(0);

    // The fetcher is usually an inline arrow, so keep the latest without
    // making it a dependency that would re-run the effect every render.
    // Updated from an effect (not during render) — React effects run in
    // declaration order, so this is committed before the fetch effect below
    // runs its own body on the same pass.
    const fetcherRef = useRef(fetcher);
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), searchDelay);
        return () => clearTimeout(t);
    }, [search, searchDelay]);

    const filterKey = JSON.stringify(filters);

    useEffect(() => {
        // Ignore a response that arrives after a newer request has been made.
        let active = true;
        dispatch({ type: 'start' });

        fetcherRef
            .current({ page, limit, search: debouncedSearch || undefined, ...filters })
            .then(res => {
                if (active) dispatch({ type: 'success', items: res.data, meta: res.meta });
            })
            .catch(err => {
                if (active) dispatch({ type: 'error', message: errorMessage(err) });
            });

        return () => {
            active = false;
        };
    }, [page, limit, debouncedSearch, filterKey, nonce, filters]);

    const setSearch = useCallback((value: string) => {
        setSearchRaw(value);
        // A new search starts from the first page, or results look empty.
        setPage(1);
    }, []);

    const setFilter = useCallback((key: string, value: string) => {
        setFilters(prev => (prev[key] === value ? prev : { ...prev, [key]: value }));
        setPage(1);
    }, []);

    const refresh = useCallback(() => setNonce(n => n + 1), []);

    return useMemo(
        () => ({ items, meta, loading, error, page, search, filters, setPage, setSearch, setFilter, refresh }),
        [items, meta, loading, error, page, search, filters, setSearch, setFilter, refresh]
    );
};
