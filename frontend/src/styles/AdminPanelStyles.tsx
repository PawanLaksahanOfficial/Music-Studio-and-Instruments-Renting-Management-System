import { C, R, S } from './DesignTokens';

export const AdminPanelStyles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: C.bg,
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
    },
    sidebar: {
        width: '240px',
        minHeight: '100vh',
        backgroundColor: C.sidebar,
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'sticky' as const,
        top: 0,
        height: '100vh',
        overflowY: 'auto' as const,
    },
    sidebarLogo: {
        padding: '24px 20px 20px',
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
        fontSize: '16px',
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.5px',
    },
    sidebarSubtitle: {
        fontSize: '11px',
        color: '#94a3b8',
        marginTop: '3px',
        fontWeight: 400
    },
    navSection: {
        padding: '16px 20px 6px',
        fontSize: '10px',
        fontWeight: 700,
        color: '#475569',
        letterSpacing: '1px',
        textTransform: 'uppercase' as const
    },
    navContainer: {
        padding: '4px 0',
        flex: 1
    },
    navItem: {
        padding: '11px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: '#94a3b8',
        borderRadius: R.sm,
        margin: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.15s',
        '&:hover': {
            backgroundColor: '#2d3548',
            color: '#fff',
        }
    },
    navItemActive: {
        padding: '11px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        color: '#fff',
        borderRadius: R.sm,
        margin: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: C.sidebarActive,
        boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
    },
    sidebarUserBox: {
        marginTop: 'auto',
        padding: '16px 20px',
        borderTop: `1px solid rgba(255,255,255,0.08)`,
        fontSize: '13px',
        color: '#94a3b8',
    },
    userName: {
        fontWeight: 600,
        color: '#e2e8f0',
        marginBottom: 2
    },
    userRole: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 10
    },
    triggerButton: (loading: boolean) => ({
        background: loading ? '#1e293b' : '#3b82f6',
        border: 'none',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 12,
        width: '100%',
        marginBottom: 10,
        fontWeight: 500
    }),
    logoutButton: {
        background: 'none',
        border: '1px solid #334155',
        color: '#94a3b8',
        padding: '6px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        width: '100%',
    },
    main: {
        flex: 1,
        padding: '28px 32px',
        overflowX: 'hidden' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: '100vh'
    },
    contentWrapper: {
        flex: 1,
        padding: 20
    }
};
