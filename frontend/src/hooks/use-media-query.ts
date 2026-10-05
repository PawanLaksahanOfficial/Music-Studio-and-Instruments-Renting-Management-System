import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query, e.g. useMediaQuery('(min-width: 768px)'). */
export const useMediaQuery = (query: string) =>
    useSyncExternalStore(
        callback => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', callback);
            return () => mql.removeEventListener('change', callback);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );

/** Tailwind `md` breakpoint and up. */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');
