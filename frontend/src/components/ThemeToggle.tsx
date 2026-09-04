import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'elvi_theme';

const readStored = (): Theme => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
        // Private mode or blocked site data — fall back to following the OS.
        return 'system';
    }
};

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const ICON: Record<Theme, string> = { system: '🖥️', light: '☀️', dark: '🌙' };
const LABEL: Record<Theme, string> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

/**
 * Light/dark/system switch. Sets `data-theme` on the root element, which the
 * token stylesheet reads — impossible with the inline styles this replaced.
 */
const ThemeToggle = () => {
    const [theme, setTheme] = useState<Theme>(readStored);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', theme);
        }
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Preference simply does not persist; the UI still works.
        }
    }, [theme]);

    return (
        <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setTheme(NEXT[theme])}
            aria-label={`${LABEL[theme]}. Activate to switch.`}
            title={LABEL[theme]}
        >
            <span aria-hidden="true">{ICON[theme]}</span>
        </button>
    );
};

export default ThemeToggle;
