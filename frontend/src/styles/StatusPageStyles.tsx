import { C, R, S } from './DesignTokens';

export const StatusPageStyles = {
    container: { maxWidth: '1000px' },
    loading: { padding: '20px', color: '#64748b' },
    error: { padding: '20px', color: '#ef4444' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
    titleSection: {},
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
    
    // Filters & Actions
    actionRow: { display: 'flex', gap: '10px', alignItems: 'flex-end' },
    dateGroup: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    dateLabel: { fontSize: '11px', fontWeight: 600, color: '#64748b' },
    dateInput: { padding: '4px 8px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '12px', outline: 'none', backgroundColor: '#fafafa', width: '130px', boxSizing: 'border-box' as const, margin: 0 },
    exportButton: { background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
    
    // Stat Cards
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' },
    card: (color: string) => ({ backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}` }),
    cardLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    cardValue: (color: string) => ({ fontSize: '28px', fontWeight: 800, margin: '6px 0 2px', color }),
    cardSub: { fontSize: '12px', color: C.textMuted },
    
    // Chart Section
    chartCard: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, marginTop: '8px' },
    chartTitle: { margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1e293b' },
    chartWrapper: { display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '0 8px' },
    chartBarContainer: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' },
    chartBarValue: { fontSize: '11px', color: '#64748b', fontWeight: 600 },
    chartBarStack: { display: 'flex', flexDirection: 'column' as const, width: '100%', maxWidth: '50px' },
    chartBarStudio: (height: number) => ({ height: `${height}px`, background: '#06b6d4', borderRadius: '3px 3px 0 0', minHeight: height > 0 ? '4px' : '0' }),
    chartBarProduct: (height: number) => ({ height: `${height}px`, background: '#3b82f6', minHeight: height > 0 ? '4px' : '0' }),
    chartBarLabel: { fontSize: '11px', color: '#64748b', textAlign: 'center' as const, whiteSpace: 'nowrap' as const },
    
    chartLegend: { display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' },
    legendColor: (color: string) => ({ width: '12px', height: '12px', background: color, borderRadius: '2px' }),
    
    // Inventory Breakdown
    inventoryCard: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, marginTop: '16px' },
    inventoryTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#1e293b' },
    inventoryGrid: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
    inventoryItem: (bg: string) => ({ flex: 1, minWidth: '160px', background: bg, borderRadius: '10px', padding: '16px 20px' }),
    inventoryValue: (color: string) => ({ fontSize: '28px', fontWeight: 800, color }),
    inventoryLabel: (color: string) => ({ fontSize: '13px', color, fontWeight: 600 }),
};
