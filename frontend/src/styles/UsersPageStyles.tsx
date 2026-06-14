import { C, R, S, StatusBadge } from './DesignTokens';

export const UsersPageStyles = {
    container: { maxWidth: '900px' },
    loading: { padding: '20px', color: '#64748b' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleSection: {},
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    
    // Table
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    tdBold: { fontWeight: 600 },
    tdSmall: { color: '#64748b', fontSize: '12px' },
    tdMonospace: { fontFamily: 'monospace', color: '#64748b' },
    
    // Actions
    actionGroup: { display: 'flex', gap: '6px' },
    editButton: { border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    toggleActiveButton: (isActive: boolean) => ({ border: 'none', background: isActive ? '#f59e0b' : '#10b981', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }),
    deleteButton: { border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    
    // Form Extra
    infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' },
    passwordWrapper: { position: 'relative' as const },
    passwordInput: { paddingRight: '70px' },
    passwordToggle: { position: 'absolute' as const, right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px' },
    shareButton: { background: '#10b981' },
    
    activeBadge: StatusBadge.active,
    inactiveBadge: StatusBadge.inactive,
    actionButton: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
};
