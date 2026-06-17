import { C, R, S } from './DesignTokens';

export const StatusPageStyles = {
    container: { maxWidth: '1100px' } as React.CSSProperties,
    loading: { padding: '20px', color: '#64748b' } as React.CSSProperties,
    error: { padding: '20px', color: '#ef4444' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' } as React.CSSProperties,
    titleSection: {} as React.CSSProperties,
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' } as React.CSSProperties,
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: '#64748b' } as React.CSSProperties,

    // Filters & Actions
    actionRow: { display: 'flex', gap: '10px', alignItems: 'flex-end' } as React.CSSProperties,
    dateGroup: { display: 'flex', flexDirection: 'column' as const, gap: '4px' } as React.CSSProperties,
    dateLabel: { fontSize: '11px', fontWeight: 600, color: '#64748b' } as React.CSSProperties,
    dateInput: { padding: '4px 8px', borderRadius: R.md, border: `1.5px solid ${C.border}`, fontSize: '12px', outline: 'none', backgroundColor: '#fafafa', width: '130px', boxSizing: 'border-box' as const, margin: 0 } as React.CSSProperties,
    exportButton: { background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 } as React.CSSProperties,

    // Stat Cards
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' } as React.CSSProperties,
    card: (color: string) => ({ backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}` } as React.CSSProperties),
    cardLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' as const } as React.CSSProperties,
    cardValue: (color: string) => ({ fontSize: '28px', fontWeight: 800, margin: '6px 0 2px', color } as React.CSSProperties),
    cardSub: { fontSize: '12px', color: C.textMuted } as React.CSSProperties,

    // Chart Section
    chartCard: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, marginTop: '8px' } as React.CSSProperties,
    chartTitle: { margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1e293b' } as React.CSSProperties,
    chartWrapper: { display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '0 8px' } as React.CSSProperties,
    chartBarContainer: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' } as React.CSSProperties,
    chartBarValue: { fontSize: '11px', color: '#64748b', fontWeight: 600 } as React.CSSProperties,
    chartBarStack: { display: 'flex', flexDirection: 'column' as const, width: '100%', maxWidth: '50px' } as React.CSSProperties,
    chartBarStudio: (height: number) => ({ height: `${Math.max(height, 0)}px`, background: '#06b6d4', borderRadius: '3px 3px 0 0', minHeight: height > 0 ? '4px' : '0' } as React.CSSProperties),
    chartBarProduct: (height: number) => ({ height: `${Math.max(height, 0)}px`, background: '#3b82f6', minHeight: height > 0 ? '4px' : '0' } as React.CSSProperties),
    chartBarLabel: { fontSize: '11px', color: '#64748b', textAlign: 'center' as const, whiteSpace: 'nowrap' as const } as React.CSSProperties,

    chartLegend: { display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center' } as React.CSSProperties,
    legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' } as React.CSSProperties,
    legendColor: (color: string) => ({ width: '12px', height: '12px', background: color, borderRadius: '2px' } as React.CSSProperties),

    // Inventory Breakdown
    inventoryCard: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, marginTop: '16px' } as React.CSSProperties,
    inventoryTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#1e293b' } as React.CSSProperties,
    inventoryGrid: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const } as React.CSSProperties,
    inventoryItem: (bg: string) => ({ flex: 1, minWidth: '160px', background: bg, borderRadius: '10px', padding: '16px 20px' } as React.CSSProperties),
    inventoryValue: (color: string) => ({ fontSize: '28px', fontWeight: 800, color } as React.CSSProperties),
    inventoryLabel: (color: string) => ({ fontSize: '13px', color, fontWeight: 600 } as React.CSSProperties),

    // ── Dashboard Analytics Sections ──
    section: { backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px', boxShadow: S.sm, border: `1px solid ${C.border}`, marginTop: '16px' } as React.CSSProperties,
    sectionTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#1e293b' } as React.CSSProperties,
    sectionTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as React.CSSProperties,
    sectionBadge: (bg: string, color: string) => ({ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block' } as React.CSSProperties),

    // Tables
    table: { width: '100%', borderCollapse: 'collapse' as const } as React.CSSProperties,
    th: { background: '#f8fafc', padding: '9px 12px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.4px', border: `1px solid ${C.border}` } as React.CSSProperties,
    thRight: { background: '#f8fafc', padding: '9px 12px', textAlign: 'right' as const, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.4px', border: `1px solid ${C.border}` } as React.CSSProperties,
    td: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#1e293b' } as React.CSSProperties,
    tdBold: { fontWeight: 600 } as React.CSSProperties,
    tdRight: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#1e293b', textAlign: 'right' as const } as React.CSSProperties,
    tableWrapper: { overflowX: 'auto' as const } as React.CSSProperties,

    // Bar charts for horizontal bars
    barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as React.CSSProperties,
    barLabel: { fontSize: 12, fontWeight: 600, color: '#475569', minWidth: 140, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const } as React.CSSProperties,
    barTrack: { flex: 1, height: 20, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' as const } as React.CSSProperties,
    barFill: (width: number, color: string) => ({ height: '100%', width: `${Math.min(width, 100)}%`, background: color, borderRadius: 10, transition: 'width 0.5s ease' } as React.CSSProperties),
    barCount: { fontSize: 12, fontWeight: 700, color: '#1e293b', minWidth: 50, textAlign: 'right' as const } as React.CSSProperties,

    // Stats row (summary numbers in dashboard sections)
    statsRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const } as React.CSSProperties,
    statBox: (bg: string, borderColor: string) => ({ background: bg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 } as React.CSSProperties),
    statNumber: (color: string) => ({ fontSize: 18, fontWeight: 800, color } as React.CSSProperties),
    statLabel: { fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.3px', marginTop: 2 } as React.CSSProperties,

    // Growth chart (line-like using bars)
    growthWrapper: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' } as React.CSSProperties,
    growthBarContainer: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3 } as React.CSSProperties,
    growthBar: (height: number) => ({ height: `${Math.max(height, 0)}px`, width: '100%', maxWidth: 30, background: '#3b82f6', borderRadius: '3px 3px 0 0', minHeight: height > 0 ? '3px' : '0' } as React.CSSProperties),
    growthLabel: { fontSize: 9, color: '#64748b', textAlign: 'center' as const, whiteSpace: 'nowrap' as const } as React.CSSProperties,
    growthValue: { fontSize: 9, color: '#1e293b', fontWeight: 700, textAlign: 'center' as const } as React.CSSProperties,

    // Empty state
    emptyState: { textAlign: 'center' as const, padding: 30, color: '#94a3b8', fontSize: 13 } as React.CSSProperties,

    // Cell variants (replacing inline overrides)
    tdBarCell: { padding: '6px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#1e293b' } as React.CSSProperties,
    tdLate: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#dc2626', textAlign: 'right' as const, fontWeight: 600 } as React.CSSProperties,
    tdFee: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#1e293b', textAlign: 'right' as const, fontWeight: 600 } as React.CSSProperties,
    tdNameBold: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#1e293b', fontWeight: 600 } as React.CSSProperties,
    tdRightColored: (active: boolean, color: string) => ({ padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, textAlign: 'right' as const, color: active ? color : '#1e293b' } as React.CSSProperties),
    tdDamageRight: { padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: '#ea580c', textAlign: 'right' as const, fontWeight: 600 } as React.CSSProperties,

    // Two-column layout for trends/growth
    twoColGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
};


