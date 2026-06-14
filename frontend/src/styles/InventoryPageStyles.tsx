import { C, R, S, StatusBadge } from './DesignTokens';

export const InventoryPageStyles = {
    container: { maxWidth: '1200px' },
    loading: { padding: 20, color: '#64748b' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleSection: {},
    title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
    
    // Filters
    filterRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const },
    searchInput: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const, maxWidth: 300 },
    statusSelect: { padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '14px', color: C.text, outline: 'none', backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer', maxWidth: 180 },
    
    // Table
    tableWrapper: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    tdBold: { fontWeight: 600 },
    tdMonospace: { fontFamily: 'monospace', fontSize: 12, color: '#64748b' },
    tdNotes: { fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    
    // Actions
    actionGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
    qrButton: { border: 'none', background: '#6366f1', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    scanButton: { border: 'none', background: '#0ea5e9', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    editButton: { border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    deleteButton: { border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
    noItems: { textAlign: 'center' as const, padding: 30, color: '#94a3b8' },
    
    // QR Modal
    qrModalContent: { backgroundColor: C.card, borderRadius: R.xl, padding: '28px', width: '100%', maxWidth: 420, textAlign: 'center' as const, maxHeight: '85vh', overflowY: 'auto' as const, boxShadow: S.lg, border: `1px solid ${C.border}` },
    qrModalTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' as const, marginBottom: 16 },
    qrModalTitle: { margin: 0, fontSize: '18px', fontWeight: 700, color: C.text },
    qrModalCloseBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: C.textMuted, lineHeight: 1 },
    
    itemInfoBox: { background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'left' as const, border: '1px solid #e2e8f0' },
    infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 },
    infoLabel: { color: '#64748b', fontWeight: 600 },
    infoValue: { color: '#1e293b', fontWeight: 500 },
    
    qrImageWrapper: { display: 'inline-block', padding: 12, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 10, marginBottom: 14 },
    qrImage: { display: 'block', borderRadius: 4 },
    qrDescription: { fontSize: 11, color: '#94a3b8', marginBottom: 16 },
    
    sizeControl: { marginBottom: 16 },
    sizeLabel: { fontSize: 12, color: '#64748b', fontWeight: 600 },
    sizeSlider: { width: '100%', marginTop: 4 },
    
    qrActionGroup: { display: 'flex', gap: 10, justifyContent: 'center' as const, flexWrap: 'wrap' as const },
    downloadBtn: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.3)', textDecoration: 'none', display: 'inline-block' },
    scanNowBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 8px rgba(14,165,233,0.3)' },
    
    // Modal & Form common
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: C.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(2px)' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
    fullWidthGroup: { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' as const, gap: '5px' },
    formLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' as const },
    actionButton: { backgroundColor: C.accent, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' },
};
