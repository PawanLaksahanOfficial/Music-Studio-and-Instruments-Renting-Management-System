import { C, R, S, StatusBadge } from './DesignTokens';

export const QRScannerPageStyles = {
    container: { maxWidth: 820, fontFamily: "'Inter','Segoe UI',sans-serif" },
    card: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px', boxShadow: S.md, border: `1px solid ${C.border}`, marginBottom: '20px' },
    cardHeader: { textAlign: 'center' as const, padding: '40px 20px' },
    cardIconLarge: { fontSize: 80, marginBottom: 18 },
    cardIconMedium: { fontSize: 68, marginBottom: 14 },
    cardTitle: { margin: '0 0 10px', fontSize: '18px', fontWeight: 700, color: C.text },
    cardSub: { margin: '0 0 20px', fontSize: '14px', color: C.textMuted, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' },
    tipText: { marginTop: 20, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 },
    code: { background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#475569' },
    
    noRecognisedHeader: { textAlign: 'center' as const, padding: '36px 20px' },
    buttonRow: { display: 'flex', gap: 10, justifyContent: 'center' as const, marginTop: 20 },
    primaryBtn: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
    
    itemBanner: { background: '#f8fafc', borderRadius: 10, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 },
    bannerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    stepLabel: { fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 },
    itemName: { margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' },
    itemModel: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
    itemPrice: { marginTop: 8, fontSize: 20, fontWeight: 800, color: '#2563eb' },
    priceDay: { fontSize: 12, fontWeight: 500, color: '#64748b' },
    
    rentalForm: { marginTop: 20 },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    fullWidthGroup: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' as const, gap: 5 },
    costBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginTop: 16 },
    costTitle: { fontWeight: 700, color: '#15803d', fontSize: 14, marginBottom: 10 },
    costRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' as const, fontSize: 14, color: '#1e293b', marginBottom: 8 },
    costTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#15803d', borderTop: '1px solid #bbf7d0', paddingTop: 10, marginTop: 4 },
    taxInput: { padding: '6px 10px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: 110, boxSizing: 'border-box' as const, margin: 0 },
    
    err: { color: C.danger, fontSize: '13px', textAlign: 'center' as const },
    
    previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' as const, marginBottom: 20 },
    printBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
    
    // Printable Area
    printArea: { border: '1px solid #e2e8f0', borderRadius: 10, padding: 24 },
    printHeader: { display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '2px solid #e2e8f0', marginBottom: 20 },
    logo: { fontSize: 22, fontWeight: 800, color: '#2563eb' },
    meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
    date: { fontSize: 12, color: '#64748b' },
    customerInfo: { textAlign: 'right' as const, fontSize: 13 },
    customerName: { fontWeight: 700, fontSize: 15 },
    customerDetail: { color: '#64748b' },
    
    itemDetailGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: '1px solid #e2e8f0' },
    detailLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 3 },
    detailValue: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
    
    printTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 0 },
    printTh: { background: '#f8fafc', padding: '9px 12px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.4px', border: '1px solid #e2e8f0' },
    printTd: { padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px' },
    printTdBold: { fontWeight: 600 },
    
    subtotalRow: { background: '#f8fafc' },
    totalRow: { background: '#eff6ff' },
    totalLabel: { fontWeight: 800, fontSize: 15 },
    totalValue: { fontWeight: 800, fontSize: 15, color: '#2563eb' },
    
    footerRow: { display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13, color: '#64748b' },
    footerBold: { color: '#1e293b' },
    notesBox: { marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#64748b' },
    thankYou: { marginTop: 18, fontSize: 11, color: '#94a3b8', textAlign: 'center' as const, borderTop: '1px solid #e2e8f0', paddingTop: 10 },
};
