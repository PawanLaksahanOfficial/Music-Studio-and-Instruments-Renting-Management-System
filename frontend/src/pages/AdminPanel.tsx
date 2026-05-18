import { useContext, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminStyles } from '../styles/AllStyles';
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/AdminFooter';
import { cronAPI } from '../services/api';

const menuItems = [
    { id: 'products',  label: 'Product Rentals', path: '/admin/products',  icon: '🎸' },
    { id: 'studio',    label: 'Studio Rentals',  path: '/admin/studio',    icon: '🎙️' },
    { id: 'invoices',  label: 'Invoices',        path: '/admin/invoices',  icon: '🧾' },
    { id: 'scanner',   label: 'QR Scanner',      path: '/admin/scanner',   icon: '📷' }, // both roles
    { id: 'inventory', label: 'Inventory',       path: '/admin/inventory', icon: '📦', adminOnly: true },
    { id: 'customers', label: 'Customers',       path: '/admin/customers', icon: '👥', adminOnly: true },
    { id: 'users',     label: 'Users',           path: '/admin/users',     icon: '🔑', adminOnly: true },
    { id: 'stats',     label: 'Statistics',      path: '/admin/stats',     icon: '📊', adminOnly: true },
];

const AdminPanel = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles   = getComponentStyle('adminLayout') as typeof AdminStyles;
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin } = useAuth();
    const [loadingReminders, setLoadingReminders] = useState(false);

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleTriggerReminders = async () => {
        if (!window.confirm('Are you sure you want to trigger due date reminders manually?')) return;
        setLoadingReminders(true);
        try {
            const res = await cronAPI.triggerReminders();
            alert(`Success: ${res.data.message}. Processed ${res.data.processedCount} rentals.`);
        } catch (error: unknown) {
            console.error('Trigger error:', error);
            let message = 'An error occurred';
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                message = axiosError.response?.data?.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            alert(`Failed: ${message}`);
        } finally {
            setLoadingReminders(false);
        }
    };

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <div style={styles.sidebarLogo}>
                    🎵 ELVI Music Studio
                    <div style={styles.sidebarSubtitle}>Management System</div>
                </div>

                <div style={styles.navSection}>Navigation</div>

                <nav style={{ padding: '4px 0', flex: 1 }}>
                    {visibleItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <div
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                style={isActive ? styles.navItemActive : styles.navItem}
                                onMouseEnter={e => {
                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2d3548';
                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#fff';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#94a3b8';
                                }}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </div>
                        );
                    })}
                </nav>

                <div style={styles.sidebarUserBox}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{user?.role}</div>
                    
                    {isAdmin && (
                        <button 
                            onClick={handleTriggerReminders} 
                            disabled={loadingReminders}
                            style={{
                                background: loadingReminders ? '#1e293b' : '#3b82f6', 
                                border: 'none', 
                                color: '#fff',
                                padding: '8px 12px', 
                                borderRadius: 6, 
                                cursor: loadingReminders ? 'not-allowed' : 'pointer',
                                fontSize: 12, 
                                width: '100%',
                                marginBottom: 10,
                                fontWeight: 500
                            }}
                        >
                            {loadingReminders ? 'Running...' : '🔔 Trigger Reminders'}
                        </button>
                    )}

                    <button onClick={handleLogout} style={{
                        background: 'none', border: '1px solid #334155', color: '#94a3b8',
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                        fontSize: 12, width: '100%',
                    }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            <main style={{ ...styles.main, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AdminHeader title="ELVI Music Studio" />
                <div style={{ flex: 1, padding: 20 }}>
                    <Outlet />
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default AdminPanel;