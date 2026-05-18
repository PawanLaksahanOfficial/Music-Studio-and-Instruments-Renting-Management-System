import React, { useContext, useEffect, useState, useRef } from 'react';
import { StyleContext } from '../context/StyleContext';
import { invoicesAPI, customersAPI, rentalsAPI, studioRentalsAPI } from '../services/api';
import Invoice, { InvoiceItem } from '../types/Invoice';
import Customer from '../types/Customer';
import Rental from '../types/Rental';
import StudioRental from '../types/StudioRental';
import { AdminStyles, InvoicePageStyles, ModalStyles, FormStyles, StatusBadge } from '../styles/AllStyles';

const emptyLine: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const InvoiceManager: React.FC = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminStyles;
    const styles = getComponentStyle('invoices') as typeof InvoicePageStyles;

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

    if (loading && invoices.length === 0) return <div style={{ padding: '20px', color: '#64748b' }}>Loading invoices...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Invoice Manager</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{invoices.length} invoices</p>
                </div>
                <button style={styles.actionButton} onClick={() => setIsModalOpen(true)}>+ New Invoice</button>
            </div>

            <div style={layoutStyles.tableWrap}>
                <table style={layoutStyles.table}>
                    <thead>
                        <tr>
                            {['Invoice ID', 'Customer', 'Linked To', 'Amount', 'Method', 'Payment', 'Created By', 'Date', 'Actions'].map(h => (
                                <th key={h} style={layoutStyles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? invoices.map(inv => (
                            <tr key={inv._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <td style={{ ...layoutStyles.td, fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{inv.invoiceId}</td>
                                <td style={{ ...layoutStyles.td, fontWeight: 600 }}>{inv.customer.firstName} {inv.customer.lastName}</td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px', color: '#64748b' }}>
                                    {[
                                        ...(inv.productRentals || []).map(r => r.rentalId),
                                        ...(inv.studioRentals || []).map(r => r.bookingId)
                                    ].join(', ') || 'Manual'}
                                </td>
                                <td style={{ ...layoutStyles.td, fontWeight: 600 }}>Rs. {inv.totalAmount}</td>
                                <td style={layoutStyles.td}>{inv.paymentMethod}</td>
                                <td style={layoutStyles.td}>
                                    <span style={inv.paymentStatus === 'Paid' ? styles.paidBadge : styles.pendingBadge}>
                                        {inv.paymentStatus}
                                    </span>
                                </td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px' }}>{inv.createdBy?.name || '—'}</td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px', color: '#64748b' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                <td style={layoutStyles.td}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => setViewInvoice(inv)}
                                            style={{ border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                            View
                                        </button>
                                        {inv.paymentStatus === 'Pending' && (
                                            <button onClick={() => updatePayment(inv, 'Paid')}
                                                style={{ border: 'none', background: '#10b981', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                                Mark Paid
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No invoices yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Invoice Modal */}
            {isModalOpen && (
                <div style={ModalStyles.overlay}>
                    <div style={{ ...ModalStyles.contentLg, maxWidth: '700px' }}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>Create Invoice</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Customer *</label>
                                    <select style={FormStyles.select} value={formData.customerId} required
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Payment Method *</label>
                                    <select style={FormStyles.select} value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        <option>Cash</option>
                                        <option>Card</option>
                                        <option>Transfer</option>
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Link to Product Rentals (Hold Ctrl to select multiple)</label>
                                    <select multiple style={{ ...FormStyles.select, height: '80px' }} 
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
                                    <label style={FormStyles.label}>Link to Studio Bookings (Hold Ctrl to select multiple)</label>
                                    <select multiple style={{ ...FormStyles.select, height: '80px' }} 
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
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ ...FormStyles.label, textTransform: 'uppercase' }}>Line Items</label>
                                    <button type="button" onClick={addLine}
                                        style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                        + Add Line
                                    </button>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                {['Description', 'Days', 'Unit Price', 'Total', ''].map(h => (
                                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((line, idx) => {
                                                const isLinked = line.description.startsWith('Product Rental:') || line.description.startsWith('Studio Booking:');
                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ padding: '6px 8px' }}>
                                                            <input style={{ ...FormStyles.input, margin: 0 }} value={line.description} required
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'description', e.target.value)} />
                                                        </td>
                                                        <td style={{ padding: '6px 8px', width: '80px' }}>
                                                            <input type="number" min={1} style={{ ...FormStyles.input, margin: 0 }} value={line.quantity === 0 ? '' : line.quantity}
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} />
                                                        </td>
                                                        <td style={{ padding: '6px 8px', width: '120px' }}>
                                                            <input type="number" min={0} style={{ ...FormStyles.input, margin: 0 }} value={line.unitPrice === 0 ? '' : line.unitPrice}
                                                                readOnly={isLinked}
                                                                onChange={e => updateLine(idx, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))} />
                                                        </td>
                                                        <td style={{ padding: '6px 12px', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                            Rs. {line.total}
                                                        </td>
                                                        <td style={{ padding: '6px 8px' }}>
                                                            {(formData.items.length > 1 || isLinked) && (
                                                                <button type="button" onClick={() => removeLine(idx)}
                                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '24px', fontSize: '14px' }}>
                                    <span style={{ color: '#64748b' }}>Subtotal: <strong>Rs. {subtotal}</strong></span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Tax (Rs.):</span>
                                        <input type="number" min={0} value={formData.tax === 0 ? '' : formData.tax} style={{ ...FormStyles.input, width: '90px', margin: 0 }}
                                            onChange={e => setFormData({ ...formData, tax: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>Total: Rs. {total}</span>
                                </div>
                            </div>

                            <div style={{ ...FormStyles.grid2, marginTop: '16px' }}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Payment Status</label>
                                    <select style={FormStyles.select} value={formData.paymentStatus}
                                        onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                                        <option>Pending</option>
                                        <option>Paid</option>
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
                                <button type="submit" style={FormStyles.submitButton}>Create Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View / Print Invoice Modal */}
            {viewInvoice && (
                <div style={ModalStyles.overlay}>
                    <div style={{ ...ModalStyles.contentLg, maxWidth: '640px' }}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>Invoice {viewInvoice.invoiceId}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handlePrint}
                                    style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                    🖨 Print
                                </button>
                                <button style={ModalStyles.closeBtn} onClick={() => setViewInvoice(null)}>✕</button>
                            </div>
                        </div>
                        <div ref={printRef}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>🎵 ELVI Music Studio</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Invoice #{viewInvoice.invoiceId}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {new Date(viewInvoice.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '13px', color: '#1e293b' }}>
                                    <strong>{viewInvoice.customer.firstName} {viewInvoice.customer.lastName}</strong>
                                    <div>{viewInvoice.customer.phone}</div>
                                    {viewInvoice.customer.email && <div>{viewInvoice.customer.email}</div>}
                                    {viewInvoice.productRentals && viewInvoice.productRentals.length > 0 && (
                                        <div style={{ color: '#64748b', fontSize: '12px' }}>
                                            Rentals: {viewInvoice.productRentals.map(r => r.rentalId).join(', ')}
                                        </div>
                                    )}
                                    {viewInvoice.studioRentals && viewInvoice.studioRentals.length > 0 && (
                                        <div style={{ color: '#64748b', fontSize: '12px' }}>
                                            Bookings: {viewInvoice.studioRentals.map(r => r.bookingId).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['Description', 'days', 'Unit Price', 'Total'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 600, border: '1px solid #e2e8f0' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewInvoice.items.map((line, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>{line.description}</td>
                                            <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>{line.quantity}</td>
                                            <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px' }}>Rs. {line.unitPrice}</td>
                                            <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 600 }}>Rs. {line.total}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: '#f8fafc' }}>
                                        <td colSpan={3} style={{ padding: '10px 12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Subtotal</td>
                                        <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>Rs. {viewInvoice.subtotal}</td>
                                    </tr>
                                    {viewInvoice.tax > 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '10px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Tax</td>
                                            <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>Rs. {viewInvoice.tax}</td>
                                        </tr>
                                    )}
                                    <tr style={{ background: '#eff6ff' }}>
                                        <td colSpan={3} style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>TOTAL</td>
                                        <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '15px', color: '#3b82f6' }}>Rs. {viewInvoice.totalAmount}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                                <div>Payment Method: <strong style={{ color: '#1e293b' }}>{viewInvoice.paymentMethod}</strong></div>
                                <div>Status: <span style={viewInvoice.paymentStatus === 'Paid' ? StatusBadge.paid : StatusBadge.pending}>{viewInvoice.paymentStatus}</span></div>
                                <div>Issued by: <strong style={{ color: '#1e293b' }}>{viewInvoice.createdBy?.name}</strong></div>
                            </div>
                            {viewInvoice.notes && (
                                <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
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
