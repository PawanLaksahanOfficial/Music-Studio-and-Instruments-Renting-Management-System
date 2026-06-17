import { useContext, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import AdminHeader from '../components/AdminHeader';
import Footer from '../components/AdminFooter';
import { cronAPI } from '../services/api';

const menuItems = [
    { id: 'products', label: 'Product Rentals', path: '/admin/products', icon: '🎸' },
    { id: 'studio', label: 'Studio Rentals', path: '/admin/studio', icon: '🎙️' },
    { id: 'invoices', label: 'Invoices', path: '/admin/invoices', icon: '🧾' },
    { id: 'scanner', label: 'QR Scanner', path: '/admin/scanner', icon: '📷' },
    { id: 'inventory', label: 'Inventory', path: '/admin/inventory', icon: '📦', adminOnly: true },
    { id: 'customers', label: 'Customers', path: '/admin/customers', icon: '👥', adminOnly: true },
    { id: 'users', label: 'Users', path: '/admin/users', icon: '🔑', adminOnly: true },
    { id: 'stats', label: 'Statistics', path: '/admin/stats', icon: '📊', adminOnly: true },
];

const archivedItems = [
    { id: 'archived-rentals', label: 'Archived Rentals', path: '/admin/archived-rentals', icon: '📋' },
    { id: 'archived-customers', label: 'Archived Customers', path: '/admin/archived-customers', icon: '👥' },
    { id: 'archived-inventory', label: 'Archived Inventory', path: '/admin/archived-inventory', icon: '📦' },
];

const AdminPanel = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle('adminLayout') as typeof AdminPanelStyles;
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin } = useAuth();
    const [loadingReminders, setLoadingReminders] = useState(false);

    const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

    const handleLogout = () => { 
        logout(); 
        navigate('/login'); 
    };

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

                <nav style={styles.navContainer}>
                    {visibleItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <div
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                style={isActive ? styles.navItemActive : styles.navItem}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </div>
                        );
                    })}
                </nav>

                {/* Archived Section - Only visible to Admin */}
                {isAdmin && (
                    <>
                        <div style={{ ...styles.navSection, marginTop: '16px' }}>Archived Records</div>
                        <nav style={styles.navContainer}>
                            {archivedItems.map(item => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate(item.path)}
                                        style={isActive ? styles.navItemActive : styles.navItem}
                                    >
                                        <span>{item.icon}</span>
                                        {item.label}
                                    </div>
                                );
                            })}
                        </nav>
                    </>
                )}

                <div style={styles.sidebarUserBox}>
                    <div style={styles.userName}>{user?.name}</div>
                    <div style={styles.userRole}>{user?.role}</div>
                    
                    {isAdmin && (
                        <button 
                            onClick={handleTriggerReminders} 
                            disabled={loadingReminders}
                            style={styles.triggerButton(loadingReminders)}
                        >
                            {loadingReminders ? 'Running...' : '🔔 Trigger Reminders'}
                        </button>
                    )}

                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Sign Out
                    </button>
                </div>
            </aside>

            <main style={styles.main}>
                <AdminHeader title="ELVI Music Studio" />
                <div style={styles.contentWrapper}>
                    <Outlet />
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default AdminPanel;