import { C, R, S } from './DesignTokens';

export const LoginPageStyles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        fontFamily: "'Inter','Segoe UI',sans-serif",
    },
    card: {
        background: '#fff',
        borderRadius: R.xl,
        padding: '40px 44px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    logo: {
        fontSize: '26px',
        fontWeight: 800,
        color: C.accent,
        marginBottom: '6px',
        textAlign: 'center' as const
    },
    subtitle: {
        fontSize: '13px',
        color: C.textMuted,
        textAlign: 'center' as const,
        marginBottom: '32px'
    },
    formGroup: {
        marginBottom: '16px'
    },
    label: {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: C.textMuted,
        marginBottom: '5px',
        letterSpacing: '0.4px',
        textTransform: 'uppercase' as const
    },
    inputWrapper: {
        position: 'relative' as const
    },
    input: {
        width: '100%',
        padding: '11px 14px',
        border: `1.5px solid ${C.border}`,
        borderRadius: R.md,
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s',
    },
    inputWithAction: {
        paddingRight: '40px'
    },
    passwordToggle: {
        position: 'absolute' as const,
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#64748b',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: C.accent,
        color: '#fff',
        border: 'none',
        borderRadius: R.md,
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: '8px',
        boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
    },
    error: {
        color: C.danger,
        fontSize: '13px',
        marginBottom: '12px',
        textAlign: 'center' as const
    },
};
