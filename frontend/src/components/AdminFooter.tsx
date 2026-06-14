import React from 'react';
import { AdminFooterStyles as styles } from '../styles/AdminFooterStyles';

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
                                    <span style={styles.statValue(s.color)}>
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

export default AdminFooter;
