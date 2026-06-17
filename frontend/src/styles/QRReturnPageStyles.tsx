import { C, R, S } from './DesignTokens';

export const QRReturnPageStyles = {
    container: { maxWidth: 780, margin: '0 auto', padding: 24 } as React.CSSProperties,
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 } as React.CSSProperties,
    pageTitle: { margin: 0, fontSize: 22, fontWeight: 800, color: C.text } as React.CSSProperties,
    pageSub: { margin: '5px 0 0', fontSize: 13, color: C.textMuted } as React.CSSProperties,
    card: { background: C.card, borderRadius: R.lg, padding: 28, boxShadow: S.md, border: `1px solid ${C.border}` } as React.CSSProperties,
    cardCentered: { textAlign: 'center' as const, padding: '20px 0' } as React.CSSProperties,
    stepLabel: { fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 } as React.CSSProperties,
    primaryBtn: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: R.md, cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' } as React.CSSProperties,
    ghostBtn: { background: 'transparent', color: C.textMuted, border: `1.5px solid ${C.border}`, padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: 14, fontWeight: 500 } as React.CSSProperties,
    printBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 } as React.CSSProperties,
    err: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', margin: 0 } as React.CSSProperties,
    errMargin: { marginTop: 12 } as React.CSSProperties,
    iconLarge: { fontSize: 48, marginBottom: 12, textAlign: 'center' as const } as React.CSSProperties,
    iconResult: { fontSize: 48, marginBottom: 12 } as React.CSSProperties,
    
    // Info / Warning / Success boxes
    infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 20px', marginTop: 16 } as React.CSSProperties,
    warningBox: { background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px', marginTop: 16 } as React.CSSProperties,
    successBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20, marginTop: 16 } as React.CSSProperties,
    
    // Labels & Values
    label: { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 } as React.CSSProperties,
    value: { fontSize: 15, fontWeight: 600, color: '#0f172a' } as React.CSSProperties,
    
    // Form inputs
    input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const } as React.CSSProperties,
    inputDisabled: { background: '#f8fafc', display: 'flex', alignItems: 'center', fontWeight: 600 } as React.CSSProperties,
    select: { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const } as React.CSSProperties,
    narrowInput: { width: 200, padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const } as React.CSSProperties,
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 } as React.CSSProperties,
    fullWidth: { gridColumn: '1 / -1' } as React.CSSProperties,
    btnRow: { display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' as const } as React.CSSProperties,
    
    // Layout grids
    detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,
    periodGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
    
    // Cost summary
    costBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginTop: 16 } as React.CSSProperties,
    costTitle: { fontWeight: 700, color: '#15803d', fontSize: 14, marginBottom: 10 } as React.CSSProperties,
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#1e293b', marginBottom: 8 } as React.CSSProperties,
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#15803d', borderTop: '2px solid #bbf7d0', paddingTop: 12, marginTop: 8 } as React.CSSProperties,
    lateFeeText: { color: '#dc2626' } as React.CSSProperties,
    damageText: { color: '#ea580c' } as React.CSSProperties,
    
    // Warning box inner
    warningTitle: { fontWeight: 700, color: '#92400e', fontSize: 14, marginBottom: 8 } as React.CSSProperties,
    infoTitle: { fontWeight: 700, color: '#1e40af', fontSize: 14, marginBottom: 8 } as React.CSSProperties,
    
    // Section titles
    sectionTitle: { fontWeight: 700, fontSize: 15, color: '#0f172a', margin: '0 0 4px' } as React.CSSProperties,
    sectionSub: { fontSize: 12, color: '#64748b', margin: '0 0 12px' } as React.CSSProperties,
    
    // Idle state
    idleTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' } as React.CSSProperties,
    idleText: { fontSize: 13, color: '#64748b', margin: '0 0 20px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 } as React.CSSProperties,
    tipText: { marginTop: 16, fontSize: 12, color: '#94a3b8' } as React.CSSProperties,
    
    // Not found / Not rented
    notFoundTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' } as React.CSSProperties,
    notFoundText: { fontSize: 13, color: '#64748b', margin: '0 0 4px' } as React.CSSProperties,
    code: { background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#475569' } as React.CSSProperties,
    notRentedText: { fontSize: 13, color: '#64748b', margin: '0 0 20px' } as React.CSSProperties,
    notRentedPadding: { textAlign: 'center' as const, padding: '20px 0' } as React.CSSProperties,
    
    // Printable receipt
    printArea: { border: '1px solid #e2e8f0', borderRadius: 10, padding: 24 } as React.CSSProperties,
    printHeader: { fontSize: 20, fontWeight: 800, color: C.accent } as React.CSSProperties,
    printMeta: { fontSize: 12, color: C.textMuted, marginTop: 3 } as React.CSSProperties,
    printCustomer: { textAlign: 'right' as const } as React.CSSProperties,
    printCustomerName: { fontSize: 14, fontWeight: 700 } as React.CSSProperties,
    printCustomerDetail: { fontSize: 12, color: C.textMuted } as React.CSSProperties,
    printTable: { width: '100%', borderCollapse: 'collapse' as const } as React.CSSProperties,
    printTh: { background: '#f8fafc', padding: '9px 12px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.4, border: '1px solid #e2e8f0' } as React.CSSProperties,
    printThRight: { background: '#f8fafc', padding: '9px 12px', textAlign: 'right' as const, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.4, border: '1px solid #e2e8f0' } as React.CSSProperties,
    printTd: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 13 } as React.CSSProperties,
    printTdBold: { fontWeight: 600 } as React.CSSProperties,
    printTdRight: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 13, textAlign: 'right' as const, fontWeight: 600 } as React.CSSProperties,
    printTotalRow: { background: '#eff6ff' } as React.CSSProperties,
    printTotalLabel: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 15, fontWeight: 800, color: C.accent } as React.CSSProperties,
    printTotalValue: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 15, fontWeight: 800, color: C.accent, textAlign: 'right' as const } as React.CSSProperties,
    printFooterRow: { display: 'flex', gap: 20, marginTop: 14, fontSize: 12, color: '#64748b' } as React.CSSProperties,
    printFooter: { marginTop: 24, fontSize: 11, color: '#94a3b8', textAlign: 'center' as const, borderTop: '1px solid #e2e8f0', paddingTop: 12 } as React.CSSProperties,
    
    // Receipt header flex
    receiptHeader: { display: 'flex', justifyContent: 'space-between', marginTop: 16 } as React.CSSProperties,
};