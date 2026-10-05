import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

// Must match public/theme-init.js, which applies the theme before React loads.
const STORAGE_KEY = 'elvi-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readStoredTheme = (): Theme => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
        return 'system';
    }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(readStoredTheme);
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const resolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }, [resolvedTheme]);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage unavailable: the choice lasts for this session only.
        }
    }, []);

    const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
