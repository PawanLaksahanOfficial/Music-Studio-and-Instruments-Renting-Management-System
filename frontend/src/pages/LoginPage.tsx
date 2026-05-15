import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StyleContext } from '../context/StyleContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle('login');
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Welcome back!');
            navigate('/admin/products');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>🎵 ELVI Studio</div>
                <p style={styles.subtitle}>Management System — Staff Login</p>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>Username</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        autoFocus
                    />

                    <label style={styles.label}>Password</label>
                    <input
                        type="password"
                        style={styles.input}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                    />

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;