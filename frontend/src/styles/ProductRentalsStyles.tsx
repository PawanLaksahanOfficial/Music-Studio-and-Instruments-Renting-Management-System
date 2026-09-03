import { C, R, S, StatusBadge } from './DesignTokens';

export const ProductRentalsStyles = {
    container: { maxWidth: '1200px' },
    loading: { padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, color: '#2c3e50' },
    actionButton: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
    
    // Table
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    noRentals: { textAlign: 'center' as const, padding: '20px' },
    
    // Actions
    actionGroup: { display: 'flex', gap: '8px' },
    editButton: { border: 'none', background: '#3498db', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    archiveButton: { border: 'none', background: '#f59e0b', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    deleteButton: { border: 'none', background: '#e74c3c', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    
    statusRented: StatusBadge.rented,
    statusOverdue: StatusBadge.overdue,
    paymentPaid: StatusBadge.paid,
    paymentPending: StatusBadge.pending,
};
