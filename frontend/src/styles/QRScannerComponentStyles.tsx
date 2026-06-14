import { C, R, S } from './DesignTokens';

export const QRScannerComponentStyles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: 'rgba(10,15,30,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        backdropFilter: 'blur(3px)',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
    },
    title: {
        fontSize: '17px',
        fontWeight: 700,
        color: '#0f172a',
    },
    subtitle: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '2px',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#64748b',
        lineHeight: 1,
        padding: '2px',
    },
    controls: {
        marginBottom: '12px'
    },
    select: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1.5px solid #e2e8f0',
        fontSize: '13px',
        color: '#1e293b',
        backgroundColor: '#f8fafc',
        outline: 'none',
        cursor: 'pointer',
    },
    viewportWrap: {
        position: 'relative' as const,
        borderRadius: '10px',
        overflow: 'hidden' as const,
        background: '#000',
        marginBottom: '14px',
        minHeight: '280px',
    },
    scannerDiv: {
        width: '100%'
    },
    loadingOverlay: {
        position: 'absolute' as const,
        inset: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
    },
    spinner: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#3b82f6',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        color: '#fff',
        marginTop: '12px',
        fontSize: '14px'
    },
    scanFrame: {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '220px',
        height: '220px',
        pointerEvents: 'none' as const,
    },
    corner: {
        position: 'absolute' as const,
        width: '22px',
        height: '22px',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTop: '3px solid #3b82f6',
        borderLeft: '3px solid #3b82f6'
    },
    topRight: {
        top: 0,
        right: 0,
        borderTop: '3px solid #3b82f6',
        borderRight: '3px solid #3b82f6'
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottom: '3px solid #3b82f6',
        borderLeft: '3px solid #3b82f6'
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottom: '3px solid #3b82f6',
        borderRight: '3px solid #3b82f6'
    },
    errorBox: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        color: '#b91c1c',
        marginBottom: '12px',
    },
    hint: {
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#64748b',
        marginBottom: '16px',
    },
    cancelBtn: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1.5px solid #e2e8f0',
        background: 'transparent',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    },
};
