// ── Design Tokens ─────────────────────────────────────────────────────────
export const tokens = {
    colors: {
        bg: '#f0f2f5',
        sidebar: '#1a1f2e',
        sidebarHover: '#2d3548',
        sidebarActive: '#3b82f6',
        card: '#ffffff',
        border: '#e2e8f0',
        text: '#1e293b',
        textMuted: '#64748b',
        accent: '#3b82f6',
        accentDark: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        overlay: 'rgba(15,20,40,0.6)',
    },
    radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
    },
    shadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 30px rgba(0,0,0,0.14)',
    },
};

export const { colors: C, radius: R, shadow: S } = tokens;

export const badge = (color: string, bg: string) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 700 as const,
    color,
    backgroundColor: bg,
    letterSpacing: '0.3px',
});

export const StatusBadge = {
    rented:    badge('#1d4ed8', '#dbeafe'),
    returned:  badge('#065f46', '#d1fae5'),
    overdue:   badge('#991b1b', '#fee2e2'),
    confirmed: badge('#1d4ed8', '#dbeafe'),
    completed: badge('#065f46', '#d1fae5'),
    cancelled: badge('#6b7280', '#f3f4f6'),
    available: badge('#065f46', '#d1fae5'),
    maintenance: badge('#92400e', '#fef3c7'),
    damaged:   badge('#991b1b', '#fee2e2'),
    lost:      badge('#6b7280', '#f3f4f6'),
    paid:      badge('#065f46', '#d1fae5'),
    pending:   badge('#92400e', '#fef3c7'),
    partial:   badge('#1e40af', '#dbeafe'),
    admin:     badge('#5b21b6', '#ede9fe'),
    cashier:   badge('#065f46', '#d1fae5'),
    active:    badge('#065f46', '#d1fae5'),
    inactive:  badge('#6b7280', '#f3f4f6'),
};
