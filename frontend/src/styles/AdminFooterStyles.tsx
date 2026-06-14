import { C, R, S } from './DesignTokens';

export const AdminFooterStyles = {
    footer: {
        marginTop: '40px',
        paddingTop: '16px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '12px',
    },
    left: {
        display: 'flex',
        alignItems: 'center',
    },
    statsRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap' as const,
    },
    dot: {
        color: '#cbd5e1',
        fontSize: '16px',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    statValue: (color?: string) => ({
        fontSize: '13px',
        fontWeight: 700,
        color: color || '#3b82f6'
    }),
    statLabel: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    brand: {
        fontSize: '13px',
        fontWeight: 700,
        color: C.accent,
    },
    copyright: {
        fontSize: '12px',
        color: '#94a3b8',
    },
};
