import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ErrorState } from '@/components/data/page';
import { BrandMark } from './brand';

export const FullPageLoader = () => (
    <div className="grid min-h-dvh place-items-center bg-background" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
            <BrandMark className="size-12 animate-pulse" />
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
    </div>
);

/** Requires a signed-in user; sends users with an admin-issued password to change it first. */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
    const { user, isLoading, error, retry } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullPageLoader />;
    if (error) return <div className="grid min-h-dvh place-items-center"><ErrorState error={error} onRetry={retry} /></div>;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />;
    return <>{children}</>;
};

/** UI guard only — the API enforces the same rule on every admin endpoint. */
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
    const { isAdmin } = useAuth();
    return isAdmin ? <>{children}</> : <Navigate to="/admin/products" replace />;
};
