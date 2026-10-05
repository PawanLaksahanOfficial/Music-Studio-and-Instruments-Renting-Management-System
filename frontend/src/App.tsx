import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { FullPageLoader, RequireAdmin, RequireAuth } from '@/components/layout/route-guards';

// Each page is its own chunk, so heavy dependencies (charts, PDF, camera) load only where used.
const LoginPage = lazy(() => import('@/features/auth/login-page'));
const ChangePasswordPage = lazy(() => import('@/features/auth/change-password-page'));
const RentalsPage = lazy(() => import('@/features/rentals/rentals-page'));
const StudioPage = lazy(() => import('@/features/studio/studio-page'));
const InvoicesPage = lazy(() => import('@/features/invoices/invoices-page'));
const CheckoutPage = lazy(() => import('@/features/checkout/checkout-page'));
const ReturnsPage = lazy(() => import('@/features/returns/returns-page'));
const InventoryPage = lazy(() => import('@/features/inventory/inventory-page'));
const DamagedPage = lazy(() => import('@/features/inventory/damaged-page'));
const CustomersPage = lazy(() => import('@/features/customers/customers-page'));
const CustomerProfilePage = lazy(() => import('@/features/customers/customer-profile-page'));
const UsersPage = lazy(() => import('@/features/users/users-page'));
const StatsPage = lazy(() => import('@/features/stats/stats-page'));
const ArchivePage = lazy(() => import('@/features/archive/archive-page'));
const NotFoundPage = lazy(() => import('@/features/not-found-page'));

const admin = (element: ReactNode) => <RequireAdmin>{element}</RequireAdmin>;

const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/change-password', element: <RequireAuth><ChangePasswordPage /></RequireAuth> },
    {
        path: '/admin',
        element: <RequireAuth><AppShell /></RequireAuth>,
        children: [
            { index: true, element: <Navigate to="products" replace /> },
            { path: 'products', element: <RentalsPage /> },
            { path: 'studio', element: <StudioPage /> },
            { path: 'invoices', element: <InvoicesPage /> },
            { path: 'scanner', element: <CheckoutPage /> },
            { path: 'returns', element: <ReturnsPage /> },
            { path: 'inventory', element: admin(<InventoryPage />) },
            { path: 'damaged-inventory', element: admin(<DamagedPage />) },
            { path: 'customers', element: admin(<CustomersPage />) },
            { path: 'customers/:id/profile', element: admin(<CustomerProfilePage />) },
            { path: 'users', element: admin(<UsersPage />) },
            { path: 'stats', element: admin(<StatsPage />) },
            { path: 'archive', element: admin(<ArchivePage />) },
            // Old archive routes now live on one tabbed page.
            { path: 'archived-rentals', element: <Navigate to="/admin/archive?tab=rentals" replace /> },
            { path: 'archived-customers', element: <Navigate to="/admin/archive?tab=customers" replace /> },
            { path: 'archived-inventory', element: <Navigate to="/admin/archive?tab=inventory" replace /> },
            { path: '*', element: <NotFoundPage /> },
        ],
    },
    { path: '/', element: <Navigate to="/admin" replace /> },
    { path: '*', element: <NotFoundPage standalone /> },
]);

const App = () => (
    <Suspense fallback={<FullPageLoader />}>
        <RouterProvider router={router} />
    </Suspense>
);

export default App;
