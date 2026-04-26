import axios from 'axios';
import Rental from '@/types/Rental';
import { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import Customer from '@/types/Customer';
import Inventory from '@/types/Inventory';


interface Props {
    isOpen: boolean;
    onClose: () => void;
    refreshData: () => void;
    selectedRental?: Rental | null;
}

const AddUpdateRental = ({ isOpen, onClose, refreshData, selectedRental }: Props) => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle("addUpdateRentals");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [inventory, setInventory] = useState<Inventory[]>([]);

    // State for form inputs (using strings for IDs to send to backend)
    const [formData, setFormData] = useState({
        customerId: selectedRental?.customer._id || '', 
        itemId: selectedRental?.items[0]?.itemId?._id || '',
        dueDate: selectedRental?.dueDate ? selectedRental.dueDate.split('T')[0] : '',
        totalAmount: selectedRental?.totalAmount || 0,
        status: selectedRental?.status || 'Rented'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, invRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/customers'),
                    axios.get('http://localhost:5000/api/inventory')
                ]);
                console.log("Customers fetched:", custRes.data);
                setCustomers(custRes.data);
                // For new rentals, only show available gear
                setInventory(invRes.data);
            } catch (err) {
                console.error("Dependency fetch failed", err);
            }
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedRental) {
                // PATCH request for existing rental
                await axios.patch(`http://localhost:5000/api/rentals/${selectedRental._id}/status`, {
                    status: formData.status
                });
            } else {
                // POST request for new rental
                await axios.post('http://localhost:5000/api/rentals', {
                    customerId: formData.customerId,
                    items: [{ itemId: formData.itemId, quantity: 1 }],
                    dueDate: formData.dueDate,
                    totalAmount: formData.totalAmount
                });
            }
            refreshData();
            onClose();
        } catch (err) {
            console.error("Submit failed", err);
            alert("Action failed. Check console for details.");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3 style={{ marginTop: 0 }}>
                    {selectedRental ? `Update Rental: ${selectedRental.rentalId}` : 'Create New Rental'}
                </h3>
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGrid}>
                        
                        {/* Hide selection fields if we are just updating status */}
                        {!selectedRental ? (
                            <>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Customer</label>
                                    <select 
                                        style={styles.input}
                                        value={formData.customerId}
                                        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select a Customer</option>
                                        {customers.map((c) => (
                                            <option key={c._id} value={c._id}>
                                                {c.firstName} {c.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Inventory Item</label>
                                    <select 
                                        style={styles.input}
                                        value={formData.itemId}
                                        onChange={(e) => setFormData({...formData, itemId: e.target.value})}
                                        required
                                    >
                                        <option value="">Select an Item</option>
                                        {inventory.map((i) => (
                                            <option key={i._id} value={i._id}>
                                                {i.itemName} ({i.serialNumber})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Total Amount (Rs.)</label>
                                    <input 
                                        type="number"
                                        style={styles.input}
                                        value={formData.totalAmount}
                                        onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Due Date</label>
                                    <input 
                                        type="date"
                                        style={styles.input}
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            // Read-only info for the update view
                            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '10px' }}>
                                <p style={{ margin: '5px 0' }}><strong>Customer:</strong> {selectedRental.customer.firstName} {selectedRental.customer.lastName}</p>
                                <p style={{ margin: '5px 0' }}><strong>Item:</strong> {selectedRental.items[0]?.itemId?.itemName}</p>
                            </div>
                        )}

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Current Status</label>
                            <select 
                                style={styles.input}
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="Rented">Rented</option>
                                <option value="Returned">Returned</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="button" onClick={onClose} style={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" style={styles.submitButton}>
                            {selectedRental ? 'Save Changes' : 'Confirm Rental'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUpdateRental;