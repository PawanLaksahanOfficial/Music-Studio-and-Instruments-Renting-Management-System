import { useCallback, useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { usersAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PasswordStrength } from '../components/PasswordStrength';
import { validatePassword } from '../utils/passwordPolicy';
import { EmptyState, ErrorState, Field, PageHeader, StatusBadge, TableSkeleton } from '../components/ui';
import { formatDateTime } from '../utils/format';
import type { Role, User } from '../types/api';

interface CreateForm {
    name: string;
    username: string;
    password: string;
    role: Role;
    email: string;
}

const EMPTY: CreateForm = { name: '', username: '', password: '', role: 'Cashier', email: '' };

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(EMPTY);
    const [editing, setEditing] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: 'Cashier' as Role, email: '' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<User | null>(null);
    const [toToggle, setToToggle] = useState<User | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        usersAPI
            .getAll()
            .then(setUsers)
            .catch(err => setError(errorMessage(err)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const passwordError = createForm.password ? validatePassword(createForm.password) : null;

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (passwordError) return;
        setSaving(true);
        setFieldErrors({});
        try {
            await usersAPI.create({
                name: createForm.name,
                username: createForm.username,
                password: createForm.password,
                role: createForm.role,
                email: createForm.email || undefined,
            });
            toast.success('User created. They will be asked to set their own password at first sign-in.');
            setCreateOpen(false);
            setCreateForm(EMPTY);
            load();
        } catch (err) {
            if (err instanceof ApiError && err.details?.length) {
                setFieldErrors(err.fieldErrors);
            } else {
                toast.error(errorMessage(err));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});
        try {
            await usersAPI.update(editing!._id, {
                name: editForm.name,
                role: editForm.role,
                email: editForm.email || undefined,
            });
            toast.success('User updated');
            setEditing(null);
            load();
        } catch (err) {
            if (err instanceof ApiError && err.details?.length) {
                setFieldErrors(err.fieldErrors);
            } else {
                toast.error(errorMessage(err));
            }
        } finally {
            setSaving(false);
        }
    };

    const sendSetupLink = async (user: User) => {
        try {
            const result = await usersAPI.sendSetupLink(user._id);
            toast.success(result.message);
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    const runAction = async (fn: () => Promise<unknown>, message: string, done: () => void) => {
        try {
            await fn();
            toast.success(message);
            load();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            done();
        }
    };

    return (
        <>
            <PageHeader
                title="Users"
                subtitle={`${users.length} staff accounts`}
                actions={
                    <button type="button" className="btn btn--primary" onClick={() => setCreateOpen(true)}>
                        + Add user
                    </button>
                }
            />

            <div className="alert alert--info mb-4">
                <span aria-hidden="true">ℹ</span>
                <div>
                    Passwords are never emailed or shown to administrators. Use <strong>Send setup link</strong> to
                    email a single-use link the user follows to set their own password.
                </div>
            </div>

            {error && <ErrorState message={error} onRetry={load} />}

            {loading ? (
                <TableSkeleton cols={6} />
            ) : users.length === 0 && !error ? (
                <div className="table-wrap">
                    <EmptyState icon="🔑" title="No users yet" />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Username</th>
                                <th scope="col">Email</th>
                                <th scope="col">Role</th>
                                <th scope="col">Status</th>
                                <th scope="col">Last sign-in</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const isSelf = user._id === currentUser?._id;
                                return (
                                    <tr key={user._id}>
                                        <td data-label="Name">
                                            <strong>{user.name}</strong>
                                            {isSelf && <span className="faint text-sm"> (you)</span>}
                                        </td>
                                        <td data-label="Username" className="table__mono">
                                            {user.username}
                                        </td>
                                        <td data-label="Email" className="table__truncate">
                                            {user.email || '—'}
                                        </td>
                                        <td data-label="Role">
                                            <StatusBadge status={user.role} />
                                        </td>
                                        <td data-label="Status">
                                            <StatusBadge status={user.isActive ? 'Active' : 'Inactive'} />
                                            {user.mustChangePassword && (
                                                <span className="badge badge--warning" style={{ marginLeft: 6 }}>
                                                    Password pending
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Last sign-in">{formatDateTime(user.lastLogin)}</td>
                                        <td data-label="Actions">
                                            <div className="btn-group">
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => {
                                                        setEditing(user);
                                                        setEditForm({
                                                            name: user.name,
                                                            role: user.role,
                                                            email: user.email ?? '',
                                                        });
                                                        setFieldErrors({});
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => void sendSetupLink(user)}
                                                    disabled={!user.email}
                                                    title={user.email ? undefined : 'Add an email address first'}
                                                >
                                                    Send setup link
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => setToToggle(user)}
                                                    disabled={isSelf}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn--sm btn--danger"
                                                    onClick={() => setToDelete(user)}
                                                    disabled={isSelf}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Create ─── */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Add user"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setCreateOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="create-user-form"
                            className="btn btn--primary"
                            disabled={saving || !!passwordError}
                        >
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Create user
                        </button>
                    </>
                }
            >
                <form id="create-user-form" onSubmit={handleCreate} className="form-grid">
                    <Field label="Full name" htmlFor="name" required error={fieldErrors.name}>
                        <input
                            id="name"
                            className="input"
                            value={createForm.name}
                            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                            required
                        />
                    </Field>

                    <Field
                        label="Username"
                        htmlFor="username"
                        required
                        error={fieldErrors.username}
                        hint="Letters, numbers, dot, underscore and hyphen."
                    >
                        <input
                            id="username"
                            className="input"
                            value={createForm.username}
                            onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                            autoComplete="off"
                            required
                        />
                    </Field>

                    <Field label="Role" htmlFor="role" error={fieldErrors.role}>
                        <select
                            id="role"
                            className="select"
                            value={createForm.role}
                            onChange={e => setCreateForm({ ...createForm, role: e.target.value as Role })}
                        >
                            <option value="Cashier">Cashier</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </Field>

                    <Field
                        label="Email"
                        htmlFor="email"
                        error={fieldErrors.email}
                        hint="Needed to send a password setup link."
                    >
                        <input
                            id="email"
                            className="input"
                            type="email"
                            value={createForm.email}
                            onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                        />
                    </Field>

                    <Field
                        label="Temporary password"
                        htmlFor="password"
                        required
                        full
                        error={passwordError ?? fieldErrors.password}
                        hint="The user must replace this at first sign-in. Prefer sending a setup link instead."
                    >
                        <input
                            id="password"
                            className="input"
                            type="password"
                            value={createForm.password}
                            onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                            aria-invalid={!!passwordError}
                            autoComplete="new-password"
                            required
                        />
                    </Field>

                    <div className="field--full">
                        <PasswordStrength password={createForm.password} />
                    </div>
                </form>
            </Modal>

            {/* ─── Edit ─── */}
            <Modal
                isOpen={!!editing}
                onClose={() => setEditing(null)}
                title={editing ? `Edit ${editing.name}` : ''}
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setEditing(null)} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" form="edit-user-form" className="btn btn--primary" disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Save changes
                        </button>
                    </>
                }
            >
                <form id="edit-user-form" onSubmit={handleEdit} className="stack">
                    <Field label="Full name" htmlFor="edit-name" required error={fieldErrors.name}>
                        <input
                            id="edit-name"
                            className="input"
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Role" htmlFor="edit-role" error={fieldErrors.role}>
                        <select
                            id="edit-role"
                            className="select"
                            value={editForm.role}
                            onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}
                        >
                            <option value="Cashier">Cashier</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </Field>

                    <Field label="Email" htmlFor="edit-email" error={fieldErrors.email}>
                        <input
                            id="edit-email"
                            className="input"
                            type="email"
                            value={editForm.email}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        />
                    </Field>

                    <p className="field__hint">
                        Passwords cannot be set here. Send a setup link so only the user ever knows their password.
                    </p>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!toToggle}
                onClose={() => setToToggle(null)}
                onConfirm={() =>
                    runAction(
                        () => usersAPI.toggleActive(toToggle!._id),
                        toToggle!.isActive ? 'User deactivated' : 'User activated',
                        () => setToToggle(null)
                    )
                }
                title={toToggle?.isActive ? 'Deactivate user' : 'Activate user'}
                message={
                    toToggle?.isActive
                        ? `${toToggle?.name} will no longer be able to sign in. Their records are kept.`
                        : `${toToggle?.name} will be able to sign in again.`
                }
                confirmLabel={toToggle?.isActive ? 'Deactivate' : 'Activate'}
                tone={toToggle?.isActive ? 'danger' : 'primary'}
            />

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() =>
                    runAction(() => usersAPI.remove(toDelete!._id), 'User deleted', () => setToDelete(null))
                }
                title="Delete user"
                message={`Permanently delete ${toDelete?.name}? Consider deactivating instead, which keeps the audit trail intact.`}
                confirmLabel="Delete"
            />
        </>
    );
};

export default UsersPage;
