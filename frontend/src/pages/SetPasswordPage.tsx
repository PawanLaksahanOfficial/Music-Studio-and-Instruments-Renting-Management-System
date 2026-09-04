import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { Field } from '../components/ui';
import { PasswordStrength } from '../components/PasswordStrength';
import { validatePassword } from '../utils/passwordPolicy';

/**
 * Landing page for the emailed setup link. Unauthenticated by design — the
 * one-time token in the URL is what authorises the change.
 */
const SetPasswordPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get('token') ?? '';
    const userId = params.get('user') ?? '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const policyError = newPassword ? validatePassword(newPassword) : null;
    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const linkValid = token.length >= 32 && userId.length > 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (policyError || mismatch) return;

        setBusy(true);
        try {
            await authAPI.setPassword(userId, token, newPassword);
            toast.success('Password set. You can sign in now.');
            navigate('/login', { replace: true });
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
                    <h1 className="auth-card__title">Set your password</h1>
                    <p className="auth-card__subtitle">Choose a password for your ELVI Music Studio account.</p>
                </div>

                {!linkValid ? (
                    <div className="stack">
                        <div className="alert alert--danger" role="alert">
                            This link is incomplete or malformed. Ask an administrator to send a new one.
                        </div>
                        <Link className="btn btn--block" to="/login">
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="stack">
                        {error && (
                            <div className="alert alert--danger" role="alert">
                                {error}
                            </div>
                        )}

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
                                autoFocus
                                required
                            />
                        </Field>

                        <PasswordStrength password={newPassword} />

                        <Field
                            label="Confirm password"
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
                            disabled={busy || !!policyError || mismatch}
                        >
                            {busy && <span className="spinner" aria-hidden="true" />}
                            {busy ? 'Saving…' : 'Set password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SetPasswordPage;
