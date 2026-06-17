import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { customersAPI } from '../services/api';
import Customer from '../types/Customer';
import DeleteConfirmation from '../components/DeleteConfirmation';
import ArchiveConfirmation from '../components/ArchiveConfirmation';
import { useAuth } from '../context/AuthContext';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import { CustomerPageStyles } from '../styles/CustomerPageStyles';
import { ModalStyles, FormStyles } from '../styles/AllStyles';
import { StatusBadge } from '../styles/DesignTokens';

const emptyForm = {
    firstName: '', 
    lastName: '',
    email: '', 
    phone: '',
    address: '', 
    nicOrPassport: '',
};

const CustomersPage: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle('customers') as typeof CustomerPageStyles;
    const { isAdmin } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<Customer | null>(null);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [toArchive, setToArchive] = useState<Customer | null>(null);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await customersAPI.getAll();
            setCustomers(res.data);
        } 
        catch (e) { 
            console.error(e); 
        }
        finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetch(); }, []);

    const openAdd = () => { 
        setSelected(null); 
        setFormData({ ...emptyForm }); 
        setIsModalOpen(true); 
    };
    const openEdit = (c: Customer) => {
        setSelected(c);
        setFormData({
            firstName: c.firstName, 
            lastName: c.lastName, 
            email: c.email || '',
            phone: c.phone, 
            address: c.address || '', 
            nicOrPassport: c.nicOrPassport,
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
        } catch { 
            alert('Failed to update status'); 
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try { 
            await customersAPI.delete(toDelete._id); 
            fetch(); 
            setIsDeleteOpen(false); 
        }
        catch { 
            alert('Delete failed'); 
        }
    };

    const confirmArchive = async () => {
        if (!toArchive) return;
        try { 
            await customersAPI.archive(toArchive._id); 
            fetch(); 
            setIsArchiveOpen(false); 
        }
        catch { 
            alert('Archive failed'); 
        }
    };

    const filtered = customers.filter(c =>
        `${c.firstName} ${c.lastName} ${c.phone} ${c.nicOrPassport}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && customers.length === 0) return <div style={styles.loading}>Loading customers...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h2 style={styles.title}>Customers</h2>
                    <p style={styles.subtitle}>{customers.length} registered</p>
                </div>
                <button style={styles.actionButton} onClick={openAdd}>+ Add Customer</button>
            </div>

            <div style={styles.filterRow}>
                <input
                    placeholder="Search by name, phone, NIC..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {['Name', 'Phone', 'Email', 'NIC / Passport', 'Status', 'Joined', 'Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(c => (
                            <tr key={c._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...styles.td, ...styles.tdBold }}>{c.firstName} {c.lastName}</td>
                                <td style={styles.td}>{c.phone}</td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>{c.email || '—'}</td>
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{c.nicOrPassport}</td>
                                <td style={styles.td}>
                                    <span style={c.isBlacklisted ? StatusBadge.overdue : StatusBadge.active}>
                                        {c.isBlacklisted ? 'Blacklisted' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => { setToArchive(c); setIsArchiveOpen(true); }}
                                            style={styles.archiveButton}>
                                            Archive
                                        </button>
                                        <button onClick={() => openEdit(c)}
                                            style={styles.editButton}>
                                            Edit
                                        </button>
                                        <button onClick={() => toggleBlacklist(c)}
                                            style={styles.blockButton(c.isBlacklisted)}>
                                            {c.isBlacklisted ? 'Unblock' : 'Block'}
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => { setToDelete(c); setIsDeleteOpen(true); }}
                                                style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} style={styles.noCustomers}>No customers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
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

            <ArchiveConfirmation
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                onConfirm={confirmArchive}
                itemName={toArchive ? `${toArchive.firstName} ${toArchive.lastName}` : ''}
            />
            {isAdmin && (
                <DeleteConfirmation
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={confirmDelete}
                    itemName={toDelete ? `${toDelete.firstName} ${toDelete.lastName}` : ''}
                />
            )}
        </div>
    );
};

export default CustomersPage;