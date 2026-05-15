import React from 'react';

interface AdminFooterProps {
    stats?: Array<{ label: string; value: string | number; color?: string }>;
}

const AdminFooter: React.FC<AdminFooterProps> = ({ stats }) => {
    const year = new Date().getFullYear();

    return (
        <footer style={styles.footer}>
            <div style={styles.left}>
                {stats && stats.length > 0 && (
                    <div style={styles.statsRow}>
                        {stats.map((s, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span style={styles.dot}>·</span>}
                                <span style={styles.statItem}>
                                    <span style={{ ...styles.statValue, color: s.color || '#3b82f6' }}>
                                        {s.value}
                                    </span>
                                    <span style={styles.statLabel}>{s.label}</span>
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
            <div style={styles.right}>
                <span style={styles.brand}>🎵 ELVI Music Studio</span>
                <span style={styles.copyright}>© {year} · Management System</span>
            </div>
        </footer>
    );
};

const styles: Record<string, React.CSSProperties> = {
    footer: {
        marginTop: '40px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
    },
    left: {
        display: 'flex',
        alignItems: 'center',
    },
    statsRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    dot: {
        color: '#cbd5e1',
        fontSize: '16px',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    statValue: {
        fontSize: '13px',
        fontWeight: 700,
    },
    statLabel: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    brand: {
        fontSize: '13px',
        fontWeight: 700,
        color: '#3b82f6',
    },
    copyright: {
        fontSize: '12px',
        color: '#94a3b8',
    },
};

export default AdminFooter;