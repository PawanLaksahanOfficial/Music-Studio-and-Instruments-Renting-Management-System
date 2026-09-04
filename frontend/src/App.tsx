import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/AdminLayout';

/**
 * Routes are lazy-loaded so the first paint ships the shell and the landing
 * page rather than all seventeen screens, their charts and the PDF library.
 */
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'));
const ProductRentals = lazy(() => import('./pages/ProductRentals'));
const StudioRentals = lazy(() => import('./pages/StudioRentals'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const InvoiceManager = lazy(() => import('./pages/InvoiceManager'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const QRScannerPage = lazy(() => import('./pages/QRScannerPage'));
const QRReturnPage = lazy(() => import('./pages/QRReturnPage'));
const DamagedInventory = lazy(() => import('./pages/DamagedInventory'));
const ArchivedRentals = lazy(() => import('./pages/ArchivedRentals'));
const ArchivedCustomers = lazy(() => import('./pages/ArchivedCustomers'));
const ArchivedInventory = lazy(() => import('./pages/ArchivedInventory'));

const RouteFallback = () => (
    <div className="stack" aria-busy="true">
        <span className="sr-only">Loading page…</span>
        <div className="skeleton" style={{ height: 32, width: '35%' }} />
        <div className="skeleton" style={{ height: 180 }} />
    </div>
);

/** Wraps an admin route in its guard. */
const admin = (element: React.ReactNode) => <ProtectedRoute requireAdmin>{element}</ProtectedRoute>;

const App = () => (
    <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <BrowserRouter>
            <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/set-password" element={<SetPasswordPage />} />
                        <Route
                            path="/change-password"
                            element={
                                <ProtectedRoute>
                                    <ChangePasswordPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="/admin/rentals" replace />} />
                            <Route path="rentals" element={<ProductRentals />} />
                            <Route path="studio" element={<StudioRentals />} />
                            <Route path="invoices" element={<InvoiceManager />} />
                            <Route path="scanner" element={<QRScannerPage />} />
                            <Route path="returns" element={<QRReturnPage />} />

                            <Route path="inventory" element={admin(<InventoryPage />)} />
                            <Route path="damaged" element={admin(<DamagedInventory />)} />
                            <Route path="customers" element={admin(<CustomersPage />)} />
                            <Route path="customers/:id" element={admin(<CustomerProfile />)} />
                            <Route path="rooms" element={admin(<RoomsPage />)} />
                            <Route path="users" element={admin(<UsersPage />)} />
                            <Route path="stats" element={admin(<StatsPage />)} />

                            <Route path="archived/rentals" element={admin(<ArchivedRentals />)} />
                            <Route path="archived/customers" element={admin(<ArchivedCustomers />)} />
                            <Route path="archived/inventory" element={admin(<ArchivedInventory />)} />
                        </Route>

                        <Route path="/" element={<Navigate to="/admin" replace />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
