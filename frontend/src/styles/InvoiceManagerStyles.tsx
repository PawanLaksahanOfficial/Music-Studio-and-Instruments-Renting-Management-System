import { C, R, S, StatusBadge } from './DesignTokens';

export const InvoiceManagerStyles = {
    container: { maxWidth: '1200px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleSection: {},
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    loading: { padding: '20px', color: '#64748b' },
    noInvoices: { textAlign: 'center' as const, padding: '30px', color: '#94a3b8' },
    
    // Table
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    tdMonospace: { fontFamily: 'monospace', fontSize: '12px', color: '#64748b' },
    tdBold: { fontWeight: 600 },
    tdSmall: { fontSize: '12px', color: '#64748b' },
    
    // Actions
    actionGroup: { display: 'flex', gap: '6px' },
    viewButton: { border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    paidButton: { border: 'none', background: '#10b981', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    
    // Modal & Form
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(2px)' },
    modalContent: { backgroundColor: C.card, borderRadius: R.xl, padding: '28px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: S.lg, border: `1px solid ${C.border}` },
    titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    formLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' as const },
    formSelect: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer' },
    selectMulti: { height: '80px' },
    
    // Line Items
    lineItemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '20px' },
    lineItemsLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' as const },
    addLineButton: { background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 },
    lineItemsTableWrapper: { border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
    lineItemsTable: { width: '100%', borderCollapse: 'collapse' as const },
    lineItemsTh: { background: '#f8fafc', padding: '8px 12px', textAlign: 'left' as const, fontSize: '11px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' },
    lineItemsTd: { padding: '6px 8px' },
    lineItemsInput: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const, margin: 0 },
    lineItemsTotalTd: { padding: '6px 12px', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' as const },
    removeLineButton: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' },
    
    // Totals
    totalsWrapper: { display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '24px', fontSize: '14px' },
    subtotalLabel: { color: '#64748b' },
    taxWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
    taxLabel: { color: '#64748b' },
    taxInput: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '90px', boxSizing: 'border-box' as const, margin: 0 },
    totalLabel: { fontWeight: 700, fontSize: '16px', color: '#1e293b' },
    
    // Notes & Grid
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
    notesGroup: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' as const, gap: '5px' },
    
    // View Modal
    viewModalContent: { backgroundColor: C.card, borderRadius: R.xl, padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: S.lg },
    printButtonGroup: { display: 'flex', gap: '8px' },
    printButton: { background: '#1e293b', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
    
    // Invoice Print Template
    printContainer: {},
    printHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    logoSection: {},
    logo: { fontSize: '20px', fontWeight: 800, color: '#3b82f6' },
    invoiceMeta: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
    dateMeta: { fontSize: '12px', color: '#64748b' },
    customerSection: { textAlign: 'right' as const, fontSize: '13px', color: '#1e293b' },
    customerName: { fontWeight: 700 },
    linkedRentals: { color: '#64748b', fontSize: '12px' },
    
    printTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '16px' },
    printTh: { padding: '10px 12px', textAlign: 'left' as const, fontSize: '12px', color: '#64748b', fontWeight: 600, border: '1px solid #e2e8f0', background: '#f8fafc' },
    printTd: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px' },
    printTdBold: { fontWeight: 600 },
    printSubtotalRow: { background: '#f8fafc' },
    printSubtotalLabel: { padding: '10px 12px', border: '1px solid #e2e8f0', textAlign: 'right' as const, fontWeight: 600 },
    printSubtotalValue: { padding: '10px 12px', border: '1px solid #e2e8f0', fontWeight: 600 },
    printTaxLabel: { padding: '10px 12px', border: '1px solid #e2e8f0', textAlign: 'right' as const },
    printTaxValue: { padding: '10px 12px', border: '1px solid #e2e8f0' },
    printTotalRow: { background: '#eff6ff' },
    printTotalLabel: { padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right' as const, fontWeight: 800, fontSize: '15px' },
    printTotalValue: { padding: '12px', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '15px', color: '#3b82f6' },
    actionButton: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
    
    printFooter: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' },
    footerItem: {},
    footerBold: { color: '#1e293b' },
    notesBox: { marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#64748b' },
    
    paidBadge: StatusBadge.paid,
    pendingBadge: StatusBadge.pending,
};
