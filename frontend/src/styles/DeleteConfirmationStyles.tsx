import { C, R, S } from './DesignTokens';

export const DeleteConfirmationStyles = {
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
    warningIcon: {
        fontSize: '50px',
        color: '#e74c3c',
        marginBottom: '10px'
    },
    title: {
        margin: '0 0 10px 0'
    },
    message: {
        color: '#666',
        marginBottom: '25px'
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
    submitButton: {
        backgroundColor: '#e74c3c',
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
