import axios from 'axios';
import Rental from '../types/Rental';
import { useEffect, useState } from 'react';
import { AddUpdateRentalStyles as styles } from '../styles/AddUpdateRentalStyles';
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

    //calculation of total amount for new rentals
    useEffect(() => {
        if (!selectedRental && formData.itemId && formData.dueDate) {
            const item = inventory.find(i => i._id === formData.itemId);
            if (item) {
                const start = new Date();
                start.setHours(0, 0, 0, 0);
                const end = new Date(formData.dueDate);
                end.setHours(0, 0, 0, 0);
                
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                
                const calcTotal = (diffDays > 0 ? diffDays : 1) * item.baseRentalPrice;
                setFormData(prev => ({ ...prev, totalAmount: calcTotal }));
            }
        }
    }, [formData.itemId, formData.dueDate, inventory, selectedRental]);

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

    return (
        <div style={styles.overlay}>
            <div style={styles.modalContent}>
                <div style={styles.titleRow}>
                    <h3 style={styles.title}>
                        {selectedRental ? `Update Rental: ${selectedRental.rentalId}` : 'Create New Rental'}
                    </h3>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGrid}>

                        {!selectedRental ? (
                            <>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Customer *</label>
                                    <select
                                        style={styles.input}
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

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Inventory Item *</label>
                                    <select
                                        style={styles.input}
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

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Total Amount (Rs.)</label>
                                    <input
                                        type="number"
                                        style={{ ...styles.input, ...styles.readOnlyInput }}
                                        value={formData.totalAmount}
                                        readOnly
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Due Date *</label>
                                    <input
                                        type="date"
                                        style={styles.input}
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={styles.infoBox}>
                                <p style={styles.infoRow}>
                                    <strong>Customer:</strong> {selectedRental.customer.firstName} {selectedRental.customer.lastName}
                                </p>
                                <p style={styles.infoRow}>
                                    <strong>Item:</strong> {selectedRental.items[0]?.itemId?.itemName || '—'}
                                </p>
                                <p style={styles.infoRow}>
                                    <strong>Current Due Date:</strong> {new Date(selectedRental.dueDate).toLocaleDateString()}
                                </p>
                                <p style={styles.infoRow}>
                                    <strong>Total:</strong> Rs. {selectedRental.totalAmount}
                                </p>
                            </div>
                        )}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Rental Status</label>
                            <select
                                style={styles.input}
                                value={formData.status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                {RENTAL_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Payment Status</label>
                            <select
                                style={styles.input}
                                value={formData.paymentStatus}
                                onChange={e => setPaymentStatus(e.target.value)}
                            >
                                {PAYMENT_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.fullWidthGroup}>
                            <label style={styles.label}>Notes</label>
                            <textarea
                                style={{ ...styles.input, ...styles.textarea }}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes..."
                            />
                        </div>
                        {selectedRental && selectedRental.status !== 'Returned' && (
                            <div style={styles.extendWrapper}>
                                <label style={styles.extendLabel}>
                                    <input
                                        type="checkbox"
                                        checked={showExtend}
                                        onChange={e => setShowExtend(e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    Extend due date
                                </label>
                                {showExtend && (
                                    <div style={styles.extendInputGroup}>
                                        <label style={styles.label}>New Due Date</label>
                                        <input
                                            type="date"
                                            style={styles.input}
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

                    <div style={styles.buttonRow}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                ...styles.submitButton,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
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