import { C, R, S } from './DesignTokens';

export const ArchivedCustomersStyles = {
    container: { padding: '24px', maxWidth: '1200px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '22px', fontWeight: 700, color: C.text, margin: 0 },
    subtitle: { fontSize: '13px', color: C.textMuted, margin: '4px 0 0' },
    loading: { padding: '40px', textAlign: 'center' as const, color: C.textMuted },
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    tdBold: { fontWeight: 600 },
    tdSmall: { fontSize: '12px', color: C.textMuted },
    tdMonospace: { fontFamily: 'monospace', fontSize: '12px' },
    noData: { padding: '24px', textAlign: 'center' as const, color: '#94a3b8' },
    actionGroup: { display: 'flex', gap: '6px' },
    restoreButton: { border: 'none', background: C.success, color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    deleteButton: { border: 'none', background: C.danger, color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
};