import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { cronAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import ConfirmDialog from './ConfirmDialog';
import ThemeToggle from './ThemeToggle';

interface NavItem {
    label: string;
    path: string;
    icon: string;
    adminOnly?: boolean;
}

const MAIN_NAV: NavItem[] = [
    { label: 'Product Rentals', path: '/admin/rentals', icon: '🎸' },
    { label: 'Studio Bookings', path: '/admin/studio', icon: '🎙️' },
    { label: 'Invoices', path: '/admin/invoices', icon: '🧾' },
    { label: 'QR Return', path: '/admin/returns', icon: '↩️' },
    { label: 'QR Lookup', path: '/admin/scanner', icon: '📷' },
    { label: 'Inventory', path: '/admin/inventory', icon: '📦', adminOnly: true },
    { label: 'Damaged Items', path: '/admin/damaged', icon: '🔧', adminOnly: true },
    { label: 'Customers', path: '/admin/customers', icon: '👥', adminOnly: true },
    { label: 'Rooms', path: '/admin/rooms', icon: '🚪', adminOnly: true },
    { label: 'Users', path: '/admin/users', icon: '🔑', adminOnly: true },
    { label: 'Statistics', path: '/admin/stats', icon: '📊', adminOnly: true },
];

const ARCHIVE_NAV: NavItem[] = [
    { label: 'Archived Rentals', path: '/admin/archived/rentals', icon: '📋' },
    { label: 'Archived Customers', path: '/admin/archived/customers', icon: '👥' },
    { label: 'Archived Inventory', path: '/admin/archived/inventory', icon: '📦' },
];

const AdminLayout = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [remindersOpen, setRemindersOpen] = useState(false);

    // Close the mobile drawer on navigation, or it covers the page just opened.
    useEffect(() => setSidebarOpen(false), [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const triggerReminders = async () => {
        try {
            const result = await cronAPI.triggerReminders();
            toast.success(`Reminders: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`);
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setRemindersOpen(false);
        }
    };

    const renderNav = (items: NavItem[]) =>
        items
            .filter(item => !item.adminOnly || isAdmin)
            .map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className="admin-nav__item"
                    // NavLink sets aria-current="page" itself, which the
                    // stylesheet uses for the active state.
                >
                    <span className="admin-nav__icon" aria-hidden="true">
                        {item.icon}
                    </span>
                    {item.label}
                </NavLink>
            ));

    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="admin-shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}>
            <a className="skip-link" href="#main-content">
                Skip to content
            </a>

            <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Close navigation"
                onClick={() => setSidebarOpen(false)}
            />

            <aside className="admin-sidebar" aria-label="Main navigation">
                <div className="admin-sidebar__brand">
                    🎵 ELVI Music Studio
                    <div className="admin-sidebar__brand-sub">Management System</div>
                </div>

                <p className="admin-sidebar__section">Navigation</p>
                <nav className="admin-nav">{renderNav(MAIN_NAV)}</nav>

                {isAdmin && (
                    <>
                        <p className="admin-sidebar__section">Archived</p>
                        <nav className="admin-nav">{renderNav(ARCHIVE_NAV)}</nav>
                    </>
                )}

                <div className="admin-sidebar__footer">
                    <div className="admin-sidebar__user">
                        <div className="admin-sidebar__user-name">{user?.name}</div>
                        <div className="admin-sidebar__user-role">{user?.role}</div>
                    </div>
                    <div className="stack" style={{ gap: 'var(--sp-2)' }}>
                        {isAdmin && (
                            <button type="button" className="btn btn--sm btn--block" onClick={() => setRemindersOpen(true)}>
                                🔔 Send reminders
                            </button>
                        )}
                        <button type="button" className="btn btn--sm btn--block" onClick={() => navigate('/change-password')}>
                            Change password
                        </button>
                        <button type="button" className="btn btn--sm btn--block" onClick={handleLogout}>
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-header">
                    <div className="row">
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm sidebar-toggle"
                            onClick={() => setSidebarOpen(v => !v)}
                            aria-expanded={sidebarOpen}
                            aria-label="Toggle navigation"
                        >
                            ☰
                        </button>
                        <span className="admin-header__date">{today}</span>
                    </div>
                    <div className="admin-header__actions">
                        <ThemeToggle />
                        <div className="avatar" aria-hidden="true">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main id="main-content" className="admin-content" tabIndex={-1}>
                    <Outlet />
                </main>

                <footer className="admin-footer">
                    ELVI Music Studio · Management System — {new Date().getFullYear()}
                </footer>
            </div>

            <ConfirmDialog
                isOpen={remindersOpen}
                onClose={() => setRemindersOpen(false)}
                onConfirm={triggerReminders}
                title="Send due-date reminders"
                message="This sends SMS and email to customers with rentals due soon or overdue. Customers who already received a given reminder will not be messaged again."
                confirmLabel="Send now"
                tone="primary"
            />
        </div>
    );
};

export default AdminLayout;
