import React, { useContext, useEffect, useState, useRef } from 'react';
import { StyleContext } from '../context/StyleContext';
import { invoicesAPI, customersAPI, rentalsAPI, studioRentalsAPI } from '../services/api';
import Invoice, { InvoiceItem } from '../types/Invoice';
import Customer from '../types/Customer';
import Rental from '../types/Rental';
import StudioRental from '../types/StudioRental';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import { InvoiceManagerStyles } from '../styles/InvoiceManagerStyles';
import { ModalStyles, FormStyles } from '../styles/AllStyles';
import { StatusBadge } from '../styles/DesignTokens';

const emptyLine: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const InvoiceManager: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminPanelStyles;
    const styles = getComponentStyle('invoices') as typeof InvoiceManagerStyles;

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [productRentals, setProductRentals] = useState<Rental[]>([]);
    const [studioRentals, setStudioRentals] = useState<StudioRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        customerId: '', productRentalIds: [] as string[], studioRentalIds: [] as string[],
        items: [] as InvoiceItem[],
        paymentMethod: 'Cash', paymentStatus: 'Pending', notes: '', tax: 0,
    });

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [invRes, cRes, prRes, srRes] = await Promise.all([
                invoicesAPI.getAll(),
                customersAPI.getAll(),
                rentalsAPI.getAll(),
                studioRentalsAPI.getAll(),
            ]);
            setInvoices(invRes.data);
            setCustomers(cRes.data);
            setProductRentals(prRes.data);
            setStudioRentals(srRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const updateLine = (idx: number, field: keyof InvoiceItem, value: string | number) => {
        const lines = [...formData.items];
        const line = { ...lines[idx], [field]: value };
        line.total = Number(line.quantity) * Number(line.unitPrice);
        lines[idx] = line;
        setFormData({ ...formData, items: lines });
    };

    const addLine = () => setFormData({ ...formData, items: [...formData.items, { ...emptyLine }] });
    const removeLine = (idx: number) => {
        const itemToRemove = formData.items[idx];
        const newFormData = { ...formData };
        newFormData.items = formData.items.filter((_, i) => i !== idx);

        // If the item was a linked rental, unselect it from the IDs
        if (itemToRemove.description.startsWith('Product Rental:')) {
            const rid = itemToRemove.description.split(': ')[1];
            const rental = productRentals.find(r => r.rentalId === rid);
            if (rental) {
                newFormData.productRentalIds = formData.productRentalIds.filter(id => id !== rental._id);
            }
        } else if (itemToRemove.description.startsWith('Studio Booking:')) {
            const bid = itemToRemove.description.split(': ')[1].split(' - ')[0];
            const rental = studioRentals.find(r => r.bookingId === bid);
            if (rental) {
                newFormData.studioRentalIds = formData.studioRentalIds.filter(id => id !== rental._id);
            }
        }

        // If the item was a linked rental, we should probably unselect it from the IDs
        // However, since the description is a string, it's hard to track back.
        // For simplicity, we just remove the line. If it was a linked rental, 
        // the user might need to unselect it from the dropdown to keep things in sync,
        // or we can try to match description patterns.
        
        setFormData(newFormData);
    };

    // Effect to sync items when rentals are selected
    useEffect(() => {
        const newItems: InvoiceItem[] = [...formData.items.filter(item => 
            !item.description.startsWith('Product Rental:') && 
            !item.description.startsWith('Studio Booking:')
        )];

        formData.productRentalIds.forEach(id => {
            const rental = productRentals.find(r => r._id === id);
            if (rental) {
                const start = new Date(rental.rentalDate);
                const end = new Date(rental.dueDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                newItems.push({
                    description: `Product Rental: ${rental.rentalId}`,
                    quantity: diffDays,
                    unitPrice: Math.round(rental.totalAmount / diffDays),
                    total: rental.totalAmount
                });
            }
        });

        formData.studioRentalIds.forEach(id => {
            const rental = studioRentals.find(r => r._id === id);
            if (rental) {
                newItems.push({
                    description: `Studio Booking: ${rental.bookingId} - ${rental.roomName}`,
                    quantity: 1,
                    unitPrice: rental.totalAmount,
                    total: rental.totalAmount
                });
            }
        });

        if (newItems.length === 0 && formData.items.length === 0) {
            newItems.push({ ...emptyLine });
        }

        setFormData(prev => ({ ...prev, items: newItems }));
    }, [formData.productRentalIds, formData.studioRentalIds, productRentals, studioRentals]);

    const subtotal = formData.items.reduce((s, l) => s + l.total, 0);
    const total = subtotal + Number(formData.tax);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoicesAPI.create({
                ...formData,
                subtotal,
                totalAmount: total,
            });
            fetchAll();
            setIsModalOpen(false);
            setFormData({ customerId: '', productRentalIds: [], studioRentalIds: [], items: [{ ...emptyLine }], paymentMethod: 'Cash', paymentStatus: 'Pending', notes: '', tax: 0 });
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Failed to create invoice');
        }
    };

    const updatePayment = async (inv: Invoice, status: string) => {
        try { await invoicesAPI.updatePayment(inv._id, status); fetchAll(); }
        catch { alert('Failed to update payment'); }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`<html><head><title>Invoice</title><style>
            body{font-family:'Segoe UI',sans-serif;margin:40px;color:#1e293b}
            table{width:100%;border-collapse:collapse;margin:16px 0}
            th,td{padding:10px 12px;border:1px solid #e2e8f0;font-size:13px}
            th{background:#f8fafc;font-weight:600}
            .header{display:flex;justify-content:space-between;margin-bottom:32px}
            .logo{font-size:22px;font-weight:800;color:#3b82f6}
            .right{text-align:right}
            .total-row td{font-weight:700;background:#f8fafc}
        </style></head><body>${content.innerHTML}</body></html>`);
        win.document.close();
        win.print();
    };

    if (loading && invoices.length === 0) return <div style={styles.loading}>Loading invoices...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h2 style={styles.title}>Invoice Manager</h2>
                    <p style={styles.subtitle}>{invoices.length} invoices</p>
                </div>
                <button style={styles.actionButton} onClick={() => setIsModalOpen(true)}>+ New Invoice</button>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {['Invoice ID', 'Customer', 'Linked To', 'Amount', 'Method', 'Payment', 'Created By', 'Date', 'Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? invoices.map(inv => (
                            <tr key={inv._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{inv.invoiceId}</td>
                                <td style={{ ...styles.td, ...styles.tdBold }}>{inv.customer.firstName} {inv.customer.lastName}</td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>
                                    {[
                                        ...(inv.productRentals || []).map(r => r.rentalId),
                                        ...(inv.studioRentals || []).map(r => r.bookingId)
                                    ].join(', ') || 'Manual'}
                                </td>
                                <td style={{ ...styles.td, ...styles.tdBold }}>Rs. {inv.totalAmount}</td>
                                <td style={styles.td}>{inv.paymentMethod}</td>
                                <td style={styles.td}>
                                    <span style={inv.paymentStatus === 'Paid' ? styles.paidBadge : styles.pendingBadge}>
                                        {inv.paymentStatus}
                                    </span>
                                </td>
                                <td style={{ ...styles.td, fontSize: '12px' }}>{inv.createdBy?.name || '—'}</td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => setViewInvoice(inv)}
                                            style={styles.viewButton}>
                                            View
                                        </button>
                                        {inv.paymentStatus === 'Pending' && (
                                            <button onClick={() => updatePayment(inv, 'Paid')}
                                                style={styles.paidButton}>
                                                Mark Paid
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={9} style={styles.noInvoices}>No invoices yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Invoice Modal */}
            {isModalOpen && (
                <div style={styles.overlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.titleRow}>
                            <h3 style={ModalStyles.title}>Create Invoice</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={styles.formLabel}>Customer *</label>
                                    <select style={styles.formSelect} value={formData.customerId} required
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={styles.formLabel}>Payment Method *</label>
                                    <select style={styles.formSelect} value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        <option>Cash</option>
                                        <option>Card</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={styles.formLabel}>Link to Product Rentals (Hold Ctrl to select multiple)</label>
                                    <select multiple style={{ ...styles.formSelect, ...styles.selectMulti }} 
                                        value={formData.productRentalIds}
                                        onChange={e => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setFormData({ ...formData, productRentalIds: values });
                                        }}>
                                        {productRentals
                                            .filter(r => r.paymentStatus === 'Pending' || formData.productRentalIds.includes(r._id))
                                            .map(r => <option key={r._id} value={r._id}>{r.rentalId}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={styles.formLabel}>Link to Studio Bookings (Hold Ctrl to select multiple)</label>
                                    <select multiple style={{ ...styles.formSelect, ...styles.selectMulti }} 
                                        value={formData.studioRentalIds}
                                        onChange={e => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setFormData({ ...formData, studioRentalIds: values });
                                        }}>
                                        {studioRentals
                                            .filter(r => r.paymentStatus === 'Pending' || formData.studioRentalIds.includes(r._id))
                                            .map(r => <option key={r._id} value={r._id}>{r.bookingId} — {r.roomName}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div style={styles.lineItemsHeader}>
                                <div style={styles.lineItemsHeader}>
                                    <label style={styles.lineItemsLabel}>Line Items</label>
                                    <button type="button" onClick={addLine}
                                        style={styles.addLineButton}>
                                        + Add Line
                                    </button>
                                </div>
                                <div style={styles.lineItemsTableWrapper}>
                                    <table style={styles.lineItemsTable}>
                                        <thead>
                                            <tr>
                                                {['Description', 'Days', 'Unit Price', 'Total', ''].map(h => (
                                                    <th key={h} style={styles.lineItemsTh}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((line, idx) => {
                                                const isLinked = line.description.startsWith('Product Rental:') || line.description.startsWith('Studio Booking:');
                                                return (
                                                    <tr key={idx}>
                                                        <td style={styles.lineItemsTd}>
                                                            <input style={styles.lineItemsInput} value={line.description} required
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'description', e.target.value)} />
                                                        </td>
                                                        <td style={{ ...styles.lineItemsTd, width: '80px' }}>
                                                            <input type="number" min={1} style={styles.lineItemsInput} value={line.quantity === 0 ? '' : line.quantity}
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                                                        </td>
                                                        <td style={{ ...styles.lineItemsTd, width: '120px' }}>
                                                            <input type="number" min={0} style={styles.lineItemsInput} value={line.unitPrice === 0 ? '' : line.unitPrice}
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))} />
                                                        </td>
                                                        <td style={styles.lineItemsTotalTd}>
                                                            Rs. {line.total}
                                                        </td>
                                                        <td style={styles.lineItemsTd}>
                                                            {(formData.items.length > 1 || isLinked) && (
                                                                <button type="button" onClick={() => removeLine(idx)}
                                                                    style={styles.removeLineButton}>✕</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={styles.totalsWrapper}>
                                    <span style={styles.subtotalLabel}>Subtotal: <strong>Rs. {subtotal}</strong></span>
                                    <div style={styles.taxWrapper}>
                                        <span style={styles.taxLabel}>Tax (Rs.):</span>
                                        <input type="number" min={0} value={formData.tax === 0 ? '' : formData.tax} style={styles.taxInput}
                                            onChange={e => setFormData({ ...formData, tax: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                    </div>
                                    <span style={styles.totalLabel}>Total: Rs. {total}</span>
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={FormStyles.group}>
                                    <label style={styles.formLabel}>Payment Status</label>
                                    <select style={styles.formSelect} value={formData.paymentStatus}
                                        onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                                        <option>Pending</option>
                                        <option>Paid</option>
                                    </select>
                                </div>
                                <div style={styles.notesGroup}>
                                    <label style={styles.formLabel}>Notes</label>
                                    <textarea style={FormStyles.textarea} value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>

                            <div style={FormStyles.buttonRow}>
                                <button type="button" style={FormStyles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" style={FormStyles.submitButton}>Create Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View / Print Invoice Modal */}
            {viewInvoice && (
                <div style={styles.overlay}>
                    <div style={styles.viewModalContent}>
                        <div style={styles.titleRow}>
                            <h3 style={styles.title}>Invoice {viewInvoice.invoiceId}</h3>
                            <div style={styles.printButtonGroup}>
                                <button onClick={handlePrint}
                                    style={styles.printButton}>
                                    🖨 Print
                                </button>
                                <button style={ModalStyles.closeBtn} onClick={() => setViewInvoice(null)}>✕</button>
                            </div>
                        </div>
                        <div ref={printRef}>
                            <div style={styles.printHeader}>
                                <div style={styles.logoSection}>
                                    <div style={styles.logo}>🎵 ELVI Music Studio</div>
                                    <div style={styles.invoiceMeta}>Invoice #{viewInvoice.invoiceId}</div>
                                    <div style={styles.dateMeta}>Date: {new Date(viewInvoice.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div style={styles.customerSection}>
                                    <strong style={styles.customerName}>{viewInvoice.customer.firstName} {viewInvoice.customer.lastName}</strong>
                                    <div>{viewInvoice.customer.phone}</div>
                                    {viewInvoice.customer.email && <div>{viewInvoice.customer.email}</div>}
                                    {viewInvoice.productRentals && viewInvoice.productRentals.length > 0 && (
                                        <div style={styles.linkedRentals}>
                                            Rentals: {viewInvoice.productRentals.map(r => r.rentalId).join(', ')}
                                        </div>
                                    )}
                                    {viewInvoice.studioRentals && viewInvoice.studioRentals.length > 0 && (
                                        <div style={styles.linkedRentals}>
                                            Bookings: {viewInvoice.studioRentals.map(r => r.bookingId).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <table style={styles.printTable}>
                                <thead>
                                    <tr>
                                        {['Description', 'days', 'Unit Price', 'Total'].map(h => (
                                            <th key={h} style={styles.printTh}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewInvoice.items.map((line, i) => (
                                        <tr key={i}>
                                            <td style={styles.printTd}>{line.description}</td>
                                            <td style={styles.printTd}>{line.quantity}</td>
                                            <td style={styles.printTd}>Rs. {line.unitPrice}</td>
                                            <td style={{ ...styles.printTd, ...styles.printTdBold }}>Rs. {line.total}</td>
                                        </tr>
                                    ))}
                                    <tr style={styles.printSubtotalRow}>
                                        <td colSpan={3} style={styles.printSubtotalLabel}>Subtotal</td>
                                        <td style={styles.printSubtotalValue}>Rs. {viewInvoice.subtotal}</td>
                                    </tr>
                                    {viewInvoice.tax > 0 && (
                                        <tr>
                                            <td colSpan={3} style={styles.printTaxLabel}>Tax</td>
                                            <td style={styles.printTaxValue}>Rs. {viewInvoice.tax}</td>
                                        </tr>
                                    )}
                                    <tr style={styles.printTotalRow}>
                                        <td colSpan={3} style={styles.printTotalLabel}>TOTAL</td>
                                        <td style={styles.printTotalValue}>Rs. {viewInvoice.totalAmount}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={styles.printFooter}>
                                <div style={styles.footerItem}>Payment Method: <strong style={styles.footerBold}>{viewInvoice.paymentMethod}</strong></div>
                                <div style={styles.footerItem}>Status: <span style={viewInvoice.paymentStatus === 'Paid' ? styles.paidBadge : styles.pendingBadge}>{viewInvoice.paymentStatus}</span></div>
                                <div style={styles.footerItem}>Issued by: <strong style={styles.footerBold}>{viewInvoice.createdBy?.name}</strong></div>
                            </div>
                            {viewInvoice.notes && (
                                <div style={styles.notesBox}>
                                    Notes: {viewInvoice.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceManager;
