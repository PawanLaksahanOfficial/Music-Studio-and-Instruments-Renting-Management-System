import { C, R, S } from './DesignTokens';

export const AddUpdateRentalStyles = {
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
        maxWidth: '560px',
        maxHeight: '85vh',
        overflowY: 'auto' as const,
        boxShadow: S.lg,
        border: `1px solid ${C.border}`
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 700,
        color: '#1e293b'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#64748b',
        lineHeight: 1
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '5px'
    },
    fullWidthGroup: {
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '5px'
    },
    label: {
        fontSize: '12px',
        fontWeight: 600,
        color: C.textMuted,
        letterSpacing: '0.4px',
        textTransform: 'uppercase' as const
    },
    input: {
        padding: '9px 12px',
        borderRadius: R.md,
        border: `1.5px solid ${C.border}`,
        fontSize: '14px',
        color: C.text,
        outline: 'none',
        backgroundColor: '#fafafa',
        width: '100%',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s',
    },
    readOnlyInput: {
        backgroundColor: '#f1f5f9',
        cursor: 'not-allowed'
    },
    textarea: {
        minHeight: '70px',
        resize: 'vertical' as const
    },
    infoBox: {
        gridColumn: '1 / -1',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: R.md,
        border: `1px solid ${C.border}`
    },
    infoRow: {
        margin: '4px 0',
        fontSize: '14px',
        color: '#1e293b'
    },
    extendWrapper: {
        gridColumn: '1 / -1'
    },
    extendLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        color: '#3b82f6',
        fontWeight: 600
    },
    checkbox: {
        width: '15px',
        height: '15px'
    },
    extendInputGroup: {
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '5px'
    },
    buttonRow: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        marginTop: '24px'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        color: '#64748b',
        border: `1.5px solid ${C.border}`,
        padding: '10px 24px',
        borderRadius: R.md,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        padding: '10px 24px',
        borderRadius: R.md,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
    },
};
