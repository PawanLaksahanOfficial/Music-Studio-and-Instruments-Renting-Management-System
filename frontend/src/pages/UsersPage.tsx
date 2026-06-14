import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { usersAPI } from '../services/api';
import User from '../types/User';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import { UsersPageStyles } from '../styles/UsersPageStyles';
import { ModalStyles, FormStyles } from '../styles/AllStyles';
import { StatusBadge } from '../styles/DesignTokens';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', username: '', password: '', email: '', role: 'Cashier' as 'Admin' | 'Cashier' };

const UsersPage: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminPanelStyles;
    const styles = getComponentStyle('users') as typeof UsersPageStyles;
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<User | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const fetch = async () => {
        setLoading(true);
        try { const res = await usersAPI.getAll(); setUsers(res.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const openAdd = () => { setSelected(null); setFormData({ ...emptyForm }); setIsModalOpen(true); };
    const openEdit = (u: User) => {
        setSelected(u);
        setFormData({ name: u.name, username: u.username, password: '', email: u.email || '', role: u.role });
        setIsModalOpen(true);
    };

    const handleShare = async () => {
        if (!selected) return;
        if (!selected.email && !formData.email) {
            alert('Please provide an email address first.');
            return;
        }
        try {
            await usersAPI.shareCredentials({ userId: selected._id, password: formData.password || undefined });
            alert('Credentials shared successfully!');
        } catch {
            alert('Failed to share credentials');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = selected
                ? { name: formData.name, role: formData.role, email: formData.email, ...(formData.password ? { password: formData.password } : {}) }
                : formData;
            let res;
            if (selected) {
                res = await usersAPI.update(selected._id, payload);
            } else {
                res = await usersAPI.create(formData);
            }

            // After creation/update, offer to share credentials if email is present
            if (formData.email && (selected || res.data._id)) {
                const userId = selected ? selected._id : res.data._id;
                if (window.confirm('User saved. Do you want to share credentials via email now?')) {
                    await usersAPI.shareCredentials({ userId, password: formData.password || undefined });
                    alert('Credentials shared successfully!');
                }
            }

            fetch();
            setIsModalOpen(false);
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Action failed');
        }
    };

    const toggleActive = async (u: User) => {
        if (u._id === currentUser?._id) { alert("You can't deactivate your own account."); return; }
        try { await usersAPI.toggleActive(u._id); fetch(); }
        catch { alert('Failed'); }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        if (toDelete._id === currentUser?._id) { alert("You can't delete your own account."); return; }
        try { await usersAPI.delete(toDelete._id); fetch(); setIsDeleteOpen(false); }
        catch { alert('Delete failed'); }
    };

    if (loading && users.length === 0) return <div style={styles.loading}>Loading users...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h2 style={styles.title}>Staff Users</h2>
                    <p style={styles.subtitle}>Manage admin and cashier accounts</p>
                </div>
                <button style={styles.actionButton} onClick={() => openAdd()}>+ New User</button>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {['Name', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...styles.td, ...styles.tdBold }}>
                                    {u.name}
                                    {u._id === currentUser?._id && (
                                        <span style={{ ...StatusBadge.active, marginLeft: '8px', fontSize: '10px' }}>You</span>
                                    )}
                                </td>
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{u.username}</td>
                                <td style={styles.td}>
                                    <span style={u.role === 'Admin' ? StatusBadge.admin : StatusBadge.cashier}>{u.role}</span>
                                </td>
                                <td style={styles.td}>
                                    <span style={u.isActive ? StatusBadge.active : StatusBadge.inactive}>
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>
                                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => openEdit(u)}
                                            style={styles.editButton}>
                                            Edit
                                        </button>
                                        <button onClick={() => toggleActive(u)}
                                            style={styles.toggleActiveButton(u.isActive)}>
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        {u._id !== currentUser?._id && (
                                            <button onClick={() => { setToDelete(u); setIsDeleteOpen(true); }}
                                                style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={ModalStyles.overlay}>
                    <div style={ModalStyles.content}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>{selected ? 'Edit User' : 'New Staff User'}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        {!selected && (
                            <div style={styles.infoBox}>
                                💡 Credentials will be shared with the staff member. They'll use these to log in.
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Full Name *</label>
                                    <input style={FormStyles.input} value={formData.name} required
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Role *</label>
                                    <select style={FormStyles.select} value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as 'Admin' | 'Cashier' })}>
                                        <option value="Cashier">Cashier</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Email</label>
                                    <input type="email" style={FormStyles.input} value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="user@example.com" />
                                </div>
                                {!selected && (
                                    <div style={FormStyles.group}>
                                        <label style={FormStyles.label}>Username *</label>
                                        <input style={FormStyles.input} value={formData.username} required
                                            onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                    </div>
                                )}
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>{selected ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                                    <div style={styles.passwordWrapper}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            style={{ ...FormStyles.input, ...styles.passwordInput }}
                                            value={formData.password}
                                            required={!selected}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={styles.passwordToggle}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div style={FormStyles.buttonRow}>
                                <button type="button" style={FormStyles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                {selected && (
                                    <button type="button"
                                        onClick={handleShare}
                                        style={{ ...FormStyles.submitButton, ...styles.shareButton }}>
                                        Share Credentials
                                    </button>
                                )}
                                <button type="submit" style={FormStyles.submitButton}>{selected ? 'Save Changes' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmation
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                itemName={toDelete?.name || ''}
            />
        </div>
    );
};

export default UsersPage;