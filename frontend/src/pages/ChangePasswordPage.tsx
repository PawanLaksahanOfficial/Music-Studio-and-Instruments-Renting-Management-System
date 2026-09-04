import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/httpClient';
import { Field } from '../components/ui';
import { PasswordStrength } from '../components/PasswordStrength';
import { validatePassword } from '../utils/passwordPolicy';

const ChangePasswordPage = () => {
    const { changePassword, mustChangePassword, logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const policyError = newPassword ? validatePassword(newPassword) : null;
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (policyError || mismatch) return;

        setBusy(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success('Password updated');
            navigate('/admin', { replace: true });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__brand">
                    <h1 className="auth-card__title">
                        {mustChangePassword ? 'Set a new password' : 'Change password'}
                    </h1>
                    {mustChangePassword && (
                        <p className="auth-card__subtitle">
                            Your account is using a password an administrator chose. Pick your own to continue.
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="stack">
                    {error && (
                        <div className="alert alert--danger" role="alert">
                            {error}
                        </div>
                    )}

                    <Field label="Current password" htmlFor="current" required>
                        <input
                            id="current"
                            type="password"
                            className="input"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </Field>

                    <Field
                        label="New password"
                        htmlFor="new"
                        required
                        error={policyError ?? undefined}
                        hint="At least 10 characters, including a letter and a number."
                    >
                        <input
                            id="new"
                            type="password"
                            className="input"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            aria-invalid={!!policyError}
                            autoComplete="new-password"
                            required
                        />
                    </Field>

                    <PasswordStrength password={newPassword} />

                    <Field
                        label="Confirm new password"
                        htmlFor="confirm"
                        required
                        error={mismatch ? 'Passwords do not match' : undefined}
                    >
                        <input
                            id="confirm"
                            type="password"
                            className="input"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            aria-invalid={mismatch}
                            autoComplete="new-password"
                            required
                        />
                    </Field>

                    <button
                        type="submit"
                        className="btn btn--primary btn--block"
                        disabled={busy || !!policyError || mismatch || !currentPassword}
                    >
                        {busy && <span className="spinner" aria-hidden="true" />}
                        {busy ? 'Updating…' : 'Update password'}
                    </button>

                    <button
                        type="button"
                        className="btn btn--ghost btn--block"
                        onClick={() => (mustChangePassword ? logout() : navigate(-1))}
                    >
                        {mustChangePassword ? 'Sign out' : 'Cancel'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
