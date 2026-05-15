// ── Design Tokens ─────────────────────────────────────────────────────────
export const tokens = {
    colors: {
        bg: '#f0f2f5',
        sidebar: '#1a1f2e',
        sidebarHover: '#2d3548',
        sidebarActive: '#3b82f6',
        card: '#ffffff',
        border: '#e2e8f0',
        text: '#1e293b',
        textMuted: '#64748b',
        accent: '#3b82f6',
        accentDark: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        overlay: 'rgba(15,20,40,0.6)',
    },
    radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
    },
    shadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 30px rgba(0,0,0,0.14)',
    },
};

const { colors: C, radius: R, shadow: S } = tokens;

// ── Shared / Admin Layout ─────────────────────────────────────────────────
export const AdminStyles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    sidebar: {
        width: '240px', minHeight: '100vh', backgroundColor: C.sidebar,
        color: '#e2e8f0', display: 'flex', flexDirection: 'column' as const,
        position: 'sticky' as const, top: 0, height: '100vh', overflowY: 'auto' as const,
    },
    sidebarLogo: {
        padding: '24px 20px 20px', borderBottom: `1px solid rgba(255,255,255,0.08)`,
        fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px',
    },
    sidebarSubtitle: { fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 400 },
    navItem: {
        padding: '11px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
        color: '#94a3b8', borderRadius: R.sm, margin: '2px 8px',
        display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s',
    },
    navItemActive: {
        padding: '11px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        color: '#fff', borderRadius: R.sm, margin: '2px 8px',
        display: 'flex', alignItems: 'center', gap: '10px',
        backgroundColor: C.sidebarActive, boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
    },
    navSection: { padding: '16px 20px 6px', fontSize: '10px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' as const },
    main: { flex: 1, padding: '28px 32px', overflowX: 'hidden' as const },
    sidebarUserBox: {
        marginTop: 'auto', padding: '16px 20px', borderTop: `1px solid rgba(255,255,255,0.08)`,
        fontSize: '13px', color: '#94a3b8',
    },
    // table shared
    tableWrap: { overflowX: 'auto' as const, borderRadius: R.lg, boxShadow: S.sm, background: C.card, border: `1px solid ${C.border}` },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: `2px solid ${C.border}`, backgroundColor: '#f8fafc', color: C.textMuted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    td: { padding: '13px 16px', borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: '14px', verticalAlign: 'middle' as const },
    trHover: { cursor: 'pointer' },
    grid: { overflowX: 'auto' as const },
};

// ── Page Header ───────────────────────────────────────────────────────────
export const PageHeaderStyles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '22px', fontWeight: 700, color: C.text },
    subtitle: { margin: '4px 0 0', fontSize: '13px', color: C.textMuted },
    actionButton: {
        backgroundColor: C.accent, color: '#fff', border: 'none',
        padding: '9px 18px', borderRadius: R.md, cursor: 'pointer',
        fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
        boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
    },
    dangerButton: {
        backgroundColor: C.danger, color: '#fff', border: 'none',
        padding: '9px 18px', borderRadius: R.md, cursor: 'pointer',
        fontSize: '14px', fontWeight: 600,
    },
    secondaryButton: {
        backgroundColor: 'transparent', color: C.accent,
        border: `1.5px solid ${C.accent}`, padding: '8px 16px',
        borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    },
};

// ── Badge / Status Pills ──────────────────────────────────────────────────
export const badge = (color: string, bg: string) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
    fontSize: '11px', fontWeight: 700, color, backgroundColor: bg, letterSpacing: '0.3px',
});

export const StatusBadge = {
    rented:    badge('#1d4ed8', '#dbeafe'),
    returned:  badge('#065f46', '#d1fae5'),
    overdue:   badge('#991b1b', '#fee2e2'),
    confirmed: badge('#1d4ed8', '#dbeafe'),
    completed: badge('#065f46', '#d1fae5'),
    cancelled: badge('#6b7280', '#f3f4f6'),
    available: badge('#065f46', '#d1fae5'),
    maintenance: badge('#92400e', '#fef3c7'),
    damaged:   badge('#991b1b', '#fee2e2'),
    lost:      badge('#6b7280', '#f3f4f6'),
    paid:      badge('#065f46', '#d1fae5'),
    pending:   badge('#92400e', '#fef3c7'),
    partial:   badge('#1e40af', '#dbeafe'),
    admin:     badge('#5b21b6', '#ede9fe'),
    cashier:   badge('#065f46', '#d1fae5'),
    active:    badge('#065f46', '#d1fae5'),
    inactive:  badge('#6b7280', '#f3f4f6'),
};

// ── Modal ─────────────────────────────────────────────────────────────────
export const ModalStyles = {
    overlay: {
        position: 'fixed' as const, inset: 0, backgroundColor: C.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px', backdropFilter: 'blur(2px)',
    },
    content: {
        backgroundColor: C.card, borderRadius: R.xl, padding: '28px',
        width: '100%', maxWidth: '520px', maxHeight: '85vh',
        overflowY: 'auto' as const, boxShadow: S.lg,
        border: `1px solid ${C.border}`,
    },
    contentLg: {
        backgroundColor: C.card, borderRadius: R.xl, padding: '28px',
        width: '100%', maxWidth: '780px', maxHeight: '90vh',
        overflowY: 'auto' as const, boxShadow: S.lg,
    },
    title: { margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: C.text },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '22px',
        cursor: 'pointer', color: C.textMuted, lineHeight: 1,
    },
    titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
};

// ── Form ──────────────────────────────────────────────────────────────────
export const FormStyles = {
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    grid1: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px' },
    group: { display: 'flex', flexDirection: 'column' as const, gap: '5px' },
    label: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.4px', textTransform: 'uppercase' as const },
    input: {
        padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`,
        fontSize: '14px', color: C.text, outline: 'none',
        backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const,
        transition: 'border-color 0.15s',
    },
    select: {
        padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`,
        fontSize: '14px', color: C.text, outline: 'none',
        backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const,
        cursor: 'pointer',
    },
    textarea: {
        padding: '9px 12px', borderRadius: R.md, border: `1.5px solid ${C.border}`,
        fontSize: '14px', color: C.text, outline: 'none',
        backgroundColor: '#fafafa', width: '100%', boxSizing: 'border-box' as const,
        resize: 'vertical' as const, minHeight: '80px',
    },
    buttonRow: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
    submitButton: {
        backgroundColor: C.accent, color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: R.md, cursor: 'pointer',
        fontSize: '14px', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
    },
    cancelButton: {
        backgroundColor: 'transparent', color: C.textMuted,
        border: `1.5px solid ${C.border}`, padding: '10px 24px',
        borderRadius: R.md, cursor: 'pointer', fontSize: '14px', fontWeight: 500,
    },
    dangerButton: {
        backgroundColor: C.danger, color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: R.md, cursor: 'pointer',
        fontSize: '14px', fontWeight: 600,
    },
    infoBox: {
        background: '#f1f5f9', borderRadius: R.md, padding: '12px 16px',
        marginBottom: '16px', border: `1px solid ${C.border}`,
    },
    infoRow: { margin: '4px 0', fontSize: '14px', color: C.text },
};

// ── Cards / Stat tiles ────────────────────────────────────────────────────
export const CardStyles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '28px' },
    card: {
        backgroundColor: C.card, borderRadius: R.lg, padding: '20px 24px',
        boxShadow: S.sm, border: `1px solid ${C.border}`,
    },
    cardLabel: { fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' as const },
    cardValue: { fontSize: '28px', fontWeight: 800, color: C.text, margin: '6px 0 2px' },
    cardSub: { fontSize: '12px', color: C.textMuted },
};

// ── Login Page ────────────────────────────────────────────────────────────
export const LoginStyles = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        fontFamily: "'Inter','Segoe UI',sans-serif",
    },
    card: {
        background: '#fff', borderRadius: R.xl, padding: '40px 44px',
        width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    logo: { fontSize: '26px', fontWeight: 800, color: C.accent, marginBottom: '6px', textAlign: 'center' as const },
    subtitle: { fontSize: '13px', color: C.textMuted, textAlign: 'center' as const, marginBottom: '32px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMuted, marginBottom: '5px', letterSpacing: '0.4px', textTransform: 'uppercase' as const },
    input: {
        width: '100%', padding: '11px 14px', border: `1.5px solid ${C.border}`,
        borderRadius: R.md, fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
        marginBottom: '16px', transition: 'border-color 0.15s',
    },
    button: {
        width: '100%', padding: '12px', backgroundColor: C.accent, color: '#fff',
        border: 'none', borderRadius: R.md, fontSize: '15px', fontWeight: 700,
        cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
    },
    error: { color: C.danger, fontSize: '13px', marginBottom: '12px', textAlign: 'center' as const },
};

// ── Product Rentals / Studio Rentals page styles ─────────────────────────
export const RentalPageStyles = {
    container: { maxWidth: '1200px' },
    header: PageHeaderStyles.header,
    actionButton: PageHeaderStyles.actionButton,
    statusRented: StatusBadge.rented,
    statusReturned: StatusBadge.returned,
    statusOverdue: StatusBadge.overdue,
    paymentPaid: StatusBadge.paid,
    paymentPending: StatusBadge.pending,
    paymentPartial: StatusBadge.partial,
};

// ── Inventory page styles ─────────────────────────────────────────────────
export const InventoryPageStyles = {
    container: { maxWidth: '1200px' },
    wrapper: { padding: '8px' },
    header: PageHeaderStyles.header,
    actionButton: PageHeaderStyles.actionButton,
    statusAvailable: StatusBadge.available,
    statusRented: StatusBadge.rented,
    statusMaintenance: StatusBadge.maintenance,
    statusDamaged: StatusBadge.damaged,
    statusLost: StatusBadge.lost,
    qrButton: {
        background: 'none', border: `1px solid ${C.border}`, color: C.accent,
        padding: '4px 10px', borderRadius: R.sm, cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    },
};

// ── Customers page ────────────────────────────────────────────────────────
export const CustomersPageStyles = {
    container: { maxWidth: '1200px' },
    header: PageHeaderStyles.header,
    actionButton: PageHeaderStyles.actionButton,
    blacklistBadge: badge('#991b1b', '#fee2e2'),
    activeBadge: badge('#065f46', '#d1fae5'),
};

// ── Users page ────────────────────────────────────────────────────────────
export const UsersPageStyles = {
    container: { maxWidth: '900px' },
    header: PageHeaderStyles.header,
    actionButton: PageHeaderStyles.actionButton,
};

// ── Invoice / Stats ───────────────────────────────────────────────────────
export const InvoicePageStyles = {
    container: { maxWidth: '1200px' },
    header: PageHeaderStyles.header,
    actionButton: PageHeaderStyles.actionButton,
    paidBadge: StatusBadge.paid,
    pendingBadge: StatusBadge.pending,
};

export const StatsPageStyles = {
    container: { maxWidth: '1000px' },
};

// ── AddUpdateRental (existing compat) ────────────────────────────────────
export const AddUpdateRentalStyles = {
    modalOverlay: ModalStyles.overlay,
    modalContent: ModalStyles.content,
    formGrid: FormStyles.grid2,
    inputGroup: FormStyles.group,
    label: FormStyles.label,
    input: FormStyles.input,
    buttonGroup: FormStyles.buttonRow,
    submitButton: FormStyles.submitButton,
    cancelButton: FormStyles.cancelButton,
};

// ── ProductRentals (existing compat) ─────────────────────────────────────
export const ProductRentalsStyles = {
    container: RentalPageStyles.container,
    header: RentalPageStyles.header,
    actionButton: RentalPageStyles.actionButton,
    statusRented: StatusBadge.rented,
    statusOverdue: StatusBadge.overdue,
    paymentPaid: StatusBadge.paid,
    paymentPending: StatusBadge.pending,
};