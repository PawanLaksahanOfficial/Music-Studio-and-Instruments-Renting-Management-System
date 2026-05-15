import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { customersAPI } from '../services/api';
import Customer from '../types/Customer';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { AdminStyles, CustomersPageStyles, ModalStyles, FormStyles } from '../styles/AllStyles';

const emptyForm = {
    firstName: '', lastName: '', email: '', phone: '',
    address: '', nicOrPassport: '',
};

const CustomersPage: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminStyles;
    const styles = getComponentStyle('customers') as typeof CustomersPageStyles;

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<Customer | null>(null);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await customersAPI.getAll();
            setCustomers(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const openAdd = () => { setSelected(null); setFormData({ ...emptyForm }); setIsModalOpen(true); };
    const openEdit = (c: Customer) => {
        setSelected(c);
        setFormData({
            firstName: c.firstName, lastName: c.lastName, email: c.email || '',
            phone: c.phone, address: c.address || '', nicOrPassport: c.nicOrPassport,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selected) {
                await customersAPI.update(selected._id, formData);
            } else {
                await customersAPI.create(formData);
            }
            fetch();
            setIsModalOpen(false);
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Action failed');
        }
    };

    const toggleBlacklist = async (c: Customer) => {
        try {
            await customersAPI.toggleBlacklist(c._id);
            fetch();
        } catch { alert('Failed to update status'); }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try { await customersAPI.delete(toDelete._id); fetch(); setIsDeleteOpen(false); }
        catch { alert('Delete failed'); }
    };

    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.phone} ${c.nicOrPassport}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && customers.length === 0) return <div style={{ padding: '20px', color: '#64748b' }}>Loading customers...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Customers</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{customers.length} registered</p>
                </div>
                <button style={styles.actionButton} onClick={openAdd}>+ Add Customer</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    placeholder="Search by name, phone, NIC..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...FormStyles.input, maxWidth: '320px' }}
                />
            </div>

            <div style={layoutStyles.tableWrap}>
                <table style={layoutStyles.table}>
                    <thead>
                        <tr>
                            {['Name', 'Phone', 'Email', 'NIC / Passport', 'Status', 'Joined', 'Actions'].map(h => (
                                <th key={h} style={layoutStyles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(c => (
                            <tr key={c._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...layoutStyles.td, fontWeight: 600 }}>{c.firstName} {c.lastName}</td>
                                <td style={layoutStyles.td}>{c.phone}</td>
                                <td style={{ ...layoutStyles.td, color: '#64748b' }}>{c.email || '—'}</td>
                                <td style={{ ...layoutStyles.td, fontFamily: 'monospace', fontSize: '12px' }}>{c.nicOrPassport}</td>
                                <td style={layoutStyles.td}>
                                    <span style={c.isBlacklisted ? styles.blacklistBadge : styles.activeBadge}>
                                        {c.isBlacklisted ? 'Blacklisted' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ ...layoutStyles.td, color: '#64748b', fontSize: '12px' }}>
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td style={layoutStyles.td}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => openEdit(c)}
                                            style={{ border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            Edit
                                        </button>
                                        <button onClick={() => toggleBlacklist(c)}
                                            style={{ border: 'none', background: c.isBlacklisted ? '#10b981' : '#f59e0b', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            {c.isBlacklisted ? 'Unblock' : 'Block'}
                                        </button>
                                        <button onClick={() => { setToDelete(c); setIsDeleteOpen(true); }}
                                            style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No customers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div style={ModalStyles.overlay}>
                    <div style={ModalStyles.content}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>{selected ? 'Edit Customer' : 'New Customer'}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>First Name *</label>
                                    <input style={FormStyles.input} value={formData.firstName} required
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Last Name *</label>
                                    <input style={FormStyles.input} value={formData.lastName} required
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Phone *</label>
                                    <input style={FormStyles.input} value={formData.phone} required
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Email</label>
                                    <input type="email" style={FormStyles.input} value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>NIC / Passport *</label>
                                    <input style={FormStyles.input} value={formData.nicOrPassport} required
                                        onChange={e => setFormData({ ...formData, nicOrPassport: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Address</label>
                                    <input style={FormStyles.input} value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                            </div>
                            <div style={FormStyles.buttonRow}>
                                <button type="button" style={FormStyles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" style={FormStyles.submitButton}>{selected ? 'Save Changes' : 'Add Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmation
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                itemName={toDelete ? `${toDelete.firstName} ${toDelete.lastName}` : ''}
            />
        </div>
    );
};

export default CustomersPage;