import './App.css';
import { BrowserRouter, useRoutes, Navigate } from 'react-router-dom';
import { StyleContextProvider } from './providers/StyleContextProvider';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ProductRentals from './pages/ProductRentals';
import StudioRentals from './pages/StudioRental';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomerPage';
import UsersPage from './pages/UsersPage';
import InvoiceManager from './pages/InvoiceManager';
import StatsPage from './pages/StatusPage';
import QRScannerPage from './pages/QRScannerPage'; // ← NEW

const AppRoutes = () => {
    const routes = useRoutes([
        { path: '/login', element: <LoginPage /> },
        {
            path: '/admin',
            element: (
                <ProtectedRoute>
                    <AdminPanel />
                </ProtectedRoute>
            ),
            children: [
                { index: true,      element: <Navigate to="/admin/products" replace /> },
                { path: 'products', element: <ProductRentals /> },
                { path: 'studio',   element: <StudioRentals /> },
                { path: 'invoices', element: <InvoiceManager /> },
                { path: 'scanner',  element: <QRScannerPage /> }, // ← NEW (both roles)
                {
                    path: 'inventory',
                    element: (
                        <ProtectedRoute requireAdmin>
                            <InventoryPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: 'customers',
                    element: (
                        <ProtectedRoute requireAdmin>
                            <CustomersPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: 'users',
                    element: (
                        <ProtectedRoute requireAdmin>
                            <UsersPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: 'stats',
                    element: (
                        <ProtectedRoute requireAdmin>
                            <StatsPage />
                        </ProtectedRoute>
                    ),
                },
            ],
        },
        { path: '/', element: <Navigate to="/admin" replace /> },
        { path: '*', element: <Navigate to="/admin" replace /> },
    ]);
    return routes;
};

function App() {
    return (
        <StyleContextProvider>
            <AuthProvider>
                <Toaster position="top-center" />
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </StyleContextProvider>
    );
}

export default App;