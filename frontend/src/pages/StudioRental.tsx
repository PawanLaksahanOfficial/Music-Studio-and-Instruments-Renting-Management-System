import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { studioRentalsAPI, customersAPI } from '../services/api';
import StudioRental from '../types/StudioRental';
import Customer from '../types/Customer';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { AdminStyles, RentalPageStyles, ModalStyles, FormStyles, StatusBadge } from '../styles/AllStyles';

const ROOMS = ['Studio A', 'Studio B', 'Studio C', 'Recording Booth'];

const statusStyle = (s: string): React.CSSProperties => ({
    Confirmed: StatusBadge.confirmed,
    Completed: StatusBadge.returned,
    Cancelled: StatusBadge.cancelled,
}[s] || StatusBadge.cancelled);

const emptyForm = {
    customerId: '', roomName: ROOMS[0], startTime: '', endTime: '',
    totalAmount: 0, status: 'Confirmed', paymentStatus: 'Pending', notes: '',
};

const StudioRentals: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminStyles;
    const styles = getComponentStyle('studioRentals') as typeof RentalPageStyles;

    const [rentals, setRentals] = useState<StudioRental[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<StudioRental | null>(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<StudioRental | null>(null);
    const [filterStatus, setFilterStatus] = useState('All');

    const fmt = (dt: string) => dt ? dt.slice(0, 16) : '';

    const fetch = async () => {
        setLoading(true);
        try {
            const [rRes, cRes] = await Promise.all([
                studioRentalsAPI.getAll(),
                customersAPI.getAll(),
            ]);
            setRentals(rRes.data);
            setCustomers(cRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const openAdd = () => { setSelected(null); setFormData({ ...emptyForm }); setIsModalOpen(true); };
    const openEdit = (r: StudioRental) => {
        setSelected(r);
        setFormData({
            customerId: r.customer._id, roomName: r.roomName,
            startTime: fmt(r.startTime), endTime: fmt(r.endTime),
            totalAmount: r.totalAmount, status: r.status,
            paymentStatus: r.paymentStatus, notes: r.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selected) {
                await studioRentalsAPI.update(selected._id, formData);
            } else {
                await studioRentalsAPI.create(formData);
            }
            fetch();
            setIsModalOpen(false);
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Action failed');
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try { await studioRentalsAPI.delete(toDelete._id); fetch(); setIsDeleteOpen(false); }
        catch { alert('Delete failed'); }
    };

    const filtered = rentals.filter(r =>
        filterStatus === 'All' || r.status === filterStatus
    );

    if (loading && rentals.length === 0) return <div style={{ padding: '20px', color: '#64748b' }}>Loading studio rentals...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Studio Rentals</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{rentals.length} total bookings</p>
                </div>
                <button style={styles.actionButton} onClick={openAdd}>+ New Booking</button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ ...FormStyles.select, maxWidth: '200px' }}>
                    <option value="All">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <div style={layoutStyles.tableWrap}>
                <table style={layoutStyles.table}>
                    <thead>
                        <tr>
                            {['Booking ID', 'Customer', 'Room', 'Start Time', 'End Time', 'Hours', 'Total', 'Status', 'Payment', 'Notes', 'Actions'].map(h => (
                                <th key={h} style={layoutStyles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(r => (
                            <tr key={r._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...layoutStyles.td, fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{r.bookingId}</td>
                                <td style={{ ...layoutStyles.td, fontWeight: 600 }}>{r.customer.firstName} {r.customer.lastName}</td>
                                <td style={layoutStyles.td}>{r.roomName}</td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px' }}>{new Date(r.startTime).toLocaleString()}</td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px' }}>{new Date(r.endTime).toLocaleString()}</td>
                                <td style={layoutStyles.td}>{r.durationHours ? `${r.durationHours}h` : '—'}</td>
                                <td style={layoutStyles.td}>Rs. {r.totalAmount}</td>
                                <td style={layoutStyles.td}><span style={statusStyle(r.status)}>{r.status}</span></td>
                                <td style={layoutStyles.td}>
                                    <span style={r.paymentStatus === 'Paid' ? StatusBadge.paid : StatusBadge.pending}>{r.paymentStatus}</span>
                                </td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.notes}>
                                    {r.notes || '—'}
                                </td>
                                <td style={layoutStyles.td}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => openEdit(r)}
                                            style={{ border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            Edit
                                        </button>
                                        <button onClick={() => { setToDelete(r); setIsDeleteOpen(true); }}
                                            style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No studio bookings found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={ModalStyles.overlay}>
                    <div style={ModalStyles.contentLg}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>{selected ? `Edit Booking: ${selected.bookingId}` : 'New Studio Booking'}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Customer *</label>
                                    <select style={FormStyles.select} value={formData.customerId} required
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => (
                                            <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.phone}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Room *</label>
                                    <select style={FormStyles.select} value={formData.roomName}
                                        onChange={e => setFormData({ ...formData, roomName: e.target.value })}>
                                        {ROOMS.map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Start Time *</label>
                                    <input type="datetime-local" style={FormStyles.input} value={formData.startTime} required
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>End Time *</label>
                                    <input type="datetime-local" style={FormStyles.input} value={formData.endTime} required
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Total Amount (Rs.) *</label>
                                    <input type="number" style={FormStyles.input} value={formData.totalAmount} required min={0}
                                        onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Status</label>
                                    <select style={FormStyles.select} value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Payment Status</label>
                                    <select style={FormStyles.select} value={formData.paymentStatus}
                                        onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div style={{ ...FormStyles.group, gridColumn: '1 / -1' }}>
                                    <label style={FormStyles.label}>Notes</label>
                                    <textarea style={FormStyles.textarea} value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>
                            <div style={FormStyles.buttonRow}>
                                <button type="button" style={FormStyles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" style={FormStyles.submitButton}>{selected ? 'Save Changes' : 'Create Booking'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmation
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                itemName={toDelete ? `${toDelete.bookingId} — ${toDelete.roomName}` : ''}
            />
        </div>
    );
};

export default StudioRentals;