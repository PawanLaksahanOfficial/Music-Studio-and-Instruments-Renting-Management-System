import React from 'react';
import { useAuth } from '../context/AuthContext';

interface Breadcrumb {
    label: string;
    path?: string;
}

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, breadcrumbs, actions }) => {
    const { user } = useAuth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={styles.wrapper}>
            {/* Top bar: date + user info */}
            <div style={styles.topBar}>
                <div style={styles.dateStr}>{dateStr}</div>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style={styles.userName}>{user?.name}</div>
                        <div style={styles.userRole}>{user?.role}</div>
                    </div>
                </div>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav style={styles.breadcrumbRow}>
                    {breadcrumbs.map((crumb, idx) => (
                        <span key={idx} style={styles.breadcrumbItem}>
                            {idx > 0 && <span style={styles.breadcrumbSep}>/</span>}
                            <span style={idx === breadcrumbs.length - 1 ? styles.breadcrumbActive : styles.breadcrumbLink}>
                                {crumb.label}
                            </span>
                        </span>
                    ))}
                </nav>
            )}

            {/* Title row + action buttons */}
            <div style={styles.titleRow}>
                <div>
                    <h1 style={styles.title}>{title}</h1>
                    {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
                </div>
                {actions && <div style={styles.actions}>{actions}</div>}
            </div>

            <div style={styles.divider} />
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        marginBottom: '24px',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    dateStr: {
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: 500,
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    avatar: {
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 700,
        flexShrink: 0,
    },
    userName: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#1e293b',
        lineHeight: 1.2,
    },
    userRole: {
        fontSize: '11px',
        color: '#94a3b8',
        lineHeight: 1.2,
    },
    breadcrumbRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        marginBottom: '10px',
    },
    breadcrumbItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    breadcrumbSep: {
        color: '#cbd5e1',
        fontSize: '13px',
        marginRight: '4px',
    },
    breadcrumbLink: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: 500,
    },
    breadcrumbActive: {
        fontSize: '12px',
        color: '#3b82f6',
        fontWeight: 600,
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '16px',
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 800,
        color: '#0f172a',
        letterSpacing: '-0.3px',
    },
    subtitle: {
        margin: '5px 0 0',
        fontSize: '13px',
        color: '#64748b',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    divider: {
        height: '1px',
        background: 'linear-gradient(90deg, #e2e8f0 0%, transparent 100%)',
    },
};

export default AdminHeader;