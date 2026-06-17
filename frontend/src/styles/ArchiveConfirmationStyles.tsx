import { C, R, S } from './DesignTokens';

export const ArchiveConfirmationStyles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: C.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(2px)'
    },
    modalContent: {
        backgroundColor: C.card,
        borderRadius: R.xl,
        padding: '28px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center' as const,
        maxHeight: '85vh',
        overflowY: 'auto' as const,
        boxShadow: S.lg,
        border: `1px solid ${C.border}`
    },
    archiveIcon: {
        fontSize: '50px',
        marginBottom: '10px'
    },
    title: {
        margin: '0 0 10px 0',
        fontSize: '20px',
        fontWeight: 700,
        color: C.text
    },
    message: {
        color: '#64748b',
        marginBottom: '25px',
        fontSize: '14px',
        lineHeight: 1.6
    },
    buttonRow: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        color: C.textMuted,
        border: `1.5px solid ${C.border}`,
        padding: '10px 24px',
        borderRadius: R.md,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        flex: 1
    },
    confirmButton: {
        backgroundColor: C.warning,
        color: '#fff',
        border: 'none',
        padding: '10px 24px',
        borderRadius: R.md,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        flex: 1
    }
};