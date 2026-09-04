import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: Props) => {
    const { isAuthenticated, isAdmin, loading, mustChangePassword } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-card" aria-busy="true">
                    <div className="skeleton skeleton--text" style={{ width: '60%' }} />
                    <div className="skeleton skeleton--text" style={{ width: '90%' }} />
                    <div className="skeleton skeleton--text" style={{ width: '75%' }} />
                    <span className="sr-only">Checking your session…</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Remember where they were headed so login can return them there.
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    // An account still on an admin-issued password cannot use the app until
    // the owner has replaced it with one only they know.
    if (mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/admin/rentals" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
