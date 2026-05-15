import axios from 'axios';
import Rental from '../types/Rental';
import { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import Customer from '../types/Customer';
import Inventory from '../types/Inventory';

type RentalStatus = 'Rented' | 'Returned' | 'Overdue';
type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

interface FormData {
    customerId: string;
    itemId: string;
    dueDate: string;
    totalAmount: number;
    status: RentalStatus;
    paymentStatus: PaymentStatus;
    notes: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    selectedRental?: Rental | null;
}

const RENTAL_STATUSES: RentalStatus[]  = ['Rented', 'Returned', 'Overdue'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Pending', 'Partial'];

const AddUpdateRental = ({ isOpen, onClose, refreshData, selectedRental }: Props) => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle('addUpdateRentals');

    const [customers, setCustomers]   = useState<Customer[]>([]);
    const [inventory, setInventory]   = useState<Inventory[]>([]);
    const [extendDate, setExtendDate] = useState('');
    const [showExtend, setShowExtend] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        customerId: selectedRental?.customer._id || '',
        itemId: selectedRental?.items[0]?.itemId?._id || '',
        dueDate: selectedRental?.dueDate ? selectedRental.dueDate.split('T')[0] : '',
        totalAmount: selectedRental?.totalAmount || 0,
        status: (selectedRental?.status as RentalStatus) || 'Rented',
        paymentStatus: (selectedRental?.paymentStatus as PaymentStatus) || 'Pending',
        notes: selectedRental?.notes || '',
    });

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            try {
                const [custRes, invRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/customers'),
                    axios.get('http://localhost:5000/api/inventory'),
                ]);
                setCustomers(custRes.data);
                setInventory(invRes.data);
            } catch (err) {
                console.error('Dependency fetch failed', err);
            }
        };
        fetchData();
    }, [isOpen]);

    useEffect(() => {
        setFormData({
            customerId: selectedRental?.customer._id || '',
            itemId: selectedRental?.items[0]?.itemId?._id || '',
            dueDate: selectedRental?.dueDate ? selectedRental.dueDate.split('T')[0] : '',
            totalAmount: selectedRental?.totalAmount || 0,
            status: (selectedRental?.status as RentalStatus) || 'Rented',
            paymentStatus: (selectedRental?.paymentStatus as PaymentStatus) || 'Pending',
            notes: selectedRental?.notes || '',
        });
        setShowExtend(false);
        setExtendDate('');
    }, [selectedRental]);

    const setStatus = (value: string) => {
        if (RENTAL_STATUSES.includes(value as RentalStatus)) {
            setFormData(prev => ({ ...prev, status: value as RentalStatus }));
        }
    };

    const setPaymentStatus = (value: string) => {
        if (PAYMENT_STATUSES.includes(value as PaymentStatus)) {
            setFormData(prev => ({ ...prev, paymentStatus: value as PaymentStatus }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedRental) {
                // Update status
                await axios.patch(
                    `http://localhost:5000/api/rentals/${selectedRental._id}/status`,
                    { status: formData.status }
                );
                // Update payment status
                await axios.patch(
                    `http://localhost:5000/api/rentals/${selectedRental._id}/payment`,
                    { paymentStatus: formData.paymentStatus }
                );
                // Extend due date if requested
                if (showExtend && extendDate) {
                    await axios.patch(
                        `http://localhost:5000/api/rentals/${selectedRental._id}/extend`,
                        { newDueDate: extendDate }
                    );
                }
            } else {
                await axios.post('http://localhost:5000/api/rentals', {
                    customerId: formData.customerId,
                    items: [{ itemId: formData.itemId, quantity: 1 }],
                    dueDate: formData.dueDate,
                    totalAmount: formData.totalAmount,
                    paymentStatus: formData.paymentStatus,
                    notes: formData.notes,
                });
            }
            refreshData();
            onClose();
        } catch (err) {
            console.error('Submit failed', err);
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Action failed. Check console for details.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle: React.CSSProperties = {
        padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
        fontSize: '14px', color: '#1e293b', width: '100%',
        boxSizing: 'border-box', backgroundColor: '#fafafa', outline: 'none',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#64748b',
        letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '5px', display: 'block',
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '560px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                        {selectedRental ? `Update Rental: ${selectedRental.rentalId}` : 'Create New Rental'}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
                    >✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                        {!selectedRental ? (
                            <>
                                {/* ── New rental fields ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={labelStyle}>Customer *</label>
                                    <select
                                        style={inputStyle}
                                        value={formData.customerId}
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a Customer</option>
                                        {customers.map(c => (
                                            <option key={c._id} value={c._id}>
                                                {c.firstName} {c.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={labelStyle}>Inventory Item *</label>
                                    <select
                                        style={inputStyle}
                                        value={formData.itemId}
                                        onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select an Item</option>
                                        {inventory.filter(i => i.status === 'Available').map(i => (
                                            <option key={i._id} value={i._id}>
                                                {i.itemName} ({i.serialNumber}) — Rs.{i.baseRentalPrice}/day
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={labelStyle}>Total Amount (Rs.) *</label>
                                    <input
                                        type="number"
                                        style={inputStyle}
                                        value={formData.totalAmount}
                                        min={0}
                                        onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label style={labelStyle}>Due Date *</label>
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{
                                gridColumn: '1 / -1', padding: '12px 16px',
                                backgroundColor: '#f1f5f9', borderRadius: '8px',
                                border: '1px solid #e2e8f0', marginBottom: '4px'
                            }}>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#1e293b' }}>
                                    <strong>Customer:</strong> {selectedRental.customer.firstName} {selectedRental.customer.lastName}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#1e293b' }}>
                                    <strong>Item:</strong> {selectedRental.items[0]?.itemId?.itemName || '—'}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#1e293b' }}>
                                    <strong>Current Due Date:</strong> {new Date(selectedRental.dueDate).toLocaleDateString()}
                                </p>
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#1e293b' }}>
                                    <strong>Total:</strong> Rs. {selectedRental.totalAmount}
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={labelStyle}>Rental Status</label>
                            <select
                                style={inputStyle}
                                value={formData.status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                {RENTAL_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={labelStyle}>Payment Status</label>
                            <select
                                style={inputStyle}
                                value={formData.paymentStatus}
                                onChange={e => setPaymentStatus(e.target.value)}
                            >
                                {PAYMENT_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={labelStyle}>Notes</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes..."
                            />
                        </div>
                        {selectedRental && selectedRental.status !== 'Returned' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#3b82f6', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        checked={showExtend}
                                        onChange={e => setShowExtend(e.target.checked)}
                                        style={{ width: '15px', height: '15px' }}
                                    />
                                    Extend due date
                                </label>
                                {showExtend && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <label style={labelStyle}>New Due Date</label>
                                        <input
                                            type="date"
                                            style={inputStyle}
                                            value={extendDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={e => setExtendDate(e.target.value)}
                                            required={showExtend}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                backgroundColor: 'transparent', color: '#64748b',
                                border: '1.5px solid #e2e8f0', padding: '10px 24px',
                                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                backgroundColor: '#3b82f6', color: '#fff', border: 'none',
                                padding: '10px 24px', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '14px', fontWeight: 600, opacity: submitting ? 0.7 : 1,
                                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                            }}
                        >
                            {submitting ? 'Saving...' : selectedRental ? 'Save Changes' : 'Confirm Rental'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUpdateRental;