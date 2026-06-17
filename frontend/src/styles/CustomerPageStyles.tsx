import { C, R, S } from './DesignTokens';

export const CustomerPageStyles = {
    container: { maxWidth: '1200px' },
    loading: { padding: '20px', color: '#64748b' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleSection: {},
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    
    // Filters
    filterRow: { marginBottom: '20px' },
    searchInput: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const, maxWidth: '320px' },
    
    // Table
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    tdBold: { fontWeight: 600 },
    tdSmall: { color: '#64748b' },
    tdMonospace: { fontFamily: 'monospace', fontSize: '12px' },
    noCustomers: { textAlign: 'center' as const, padding: '30px', color: '#94a3b8' },
    
    // Actions
    actionGroup: { display: 'flex', gap: '6px' },
    editButton: { border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    archiveButton: { border: 'none', background: '#f59e0b', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    blockButton: (isBlacklisted: boolean) => ({ border: 'none', background: isBlacklisted ? '#10b981' : '#f59e0b', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }),
    deleteButton: { border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    
    // Modal common
    modalOverlay: { position: 'fixed' as const, inset: 0, backgroundColor: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(2px)' },
    actionButton: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
};
