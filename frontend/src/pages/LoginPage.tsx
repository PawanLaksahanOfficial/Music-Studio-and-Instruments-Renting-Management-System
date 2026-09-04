import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/httpClient';
import { Field } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/admin" replace />;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const user = await login(username, password);
            // A first sign-in on an admin-issued password goes straight to the
            // change screen rather than into the app.
            if (user.mustChangePassword) {
                navigate('/change-password', { replace: true });
                return;
            }
            const from = (location.state as { from?: string } | null)?.from;
            navigate(from ?? '/admin', { replace: true });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="row row--between mb-4">
                    <span />
                    <ThemeToggle />
                </div>

                <div className="auth-card__brand">
                    <div style={{ fontSize: 34 }} aria-hidden="true">
                        🎵
                    </div>
                    <h1 className="auth-card__title">ELVI Music Studio</h1>
                    <p className="auth-card__subtitle">Sign in to the management system</p>
                </div>

                <form onSubmit={handleSubmit} className="stack">
                    {error && (
                        <div className="alert alert--danger" role="alert">
                            {error}
                        </div>
                    )}

                    <Field label="Username" htmlFor="username" required>
                        <input
                            id="username"
                            className="input"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                        />
                    </Field>

                    <Field label="Password" htmlFor="password" required>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </Field>

                    <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                        {busy && <span className="spinner" aria-hidden="true" />}
                        {busy ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
