import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StyleContext } from '../context/StyleContext';
import { inventoryAPI } from '../services/api';
import Inventory from '../types/Inventory';
import DeleteConfirmation from '../components/DeleteConfirmation';
import { AdminStyles, InventoryPageStyles, ModalStyles, FormStyles, StatusBadge } from '../styles/AllStyles';

const CATEGORIES = ['Instruments', 'Audio Gear', 'Cables', 'Other'] as const;
const STATUSES   = ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'] as const;

interface InventoryForm {
    itemName: string;
    category: 'Instruments' | 'Audio Gear' | 'Cables' | 'Other';
    brand: string;
    model: string;
    serialNumber: string;
    status: 'Available' | 'Rented' | 'Maintenance' | 'Damaged' | 'Lost';
    baseRentalPrice: number;
    purchaseDate: string;
    notes: string;
}

const emptyForm: InventoryForm = {
    itemName: '', category: 'Instruments', brand: '', model: '',
    serialNumber: '', status: 'Available', baseRentalPrice: 0, purchaseDate: '',
    notes: '',
};

const statusStyle = (s: string) => {
    const map: Record<string, React.CSSProperties> = {
        Available: StatusBadge.available, Rented: StatusBadge.rented,
        Maintenance: StatusBadge.maintenance, Damaged: StatusBadge.damaged, Lost: StatusBadge.lost,
    };
    return map[s] || StatusBadge.lost;
};

// QR payload encodes the qrCodeId PLUS extra item info so scanning
// shows meaningful context. Backend lookup only uses the qrCodeId part.
const buildQRPayload = (item: Inventory) =>
    `${item.qrCodeId}|${item.itemName}|${item.serialNumber}|${item.baseRentalPrice}`;

const InventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle('adminLayout') as typeof AdminStyles;
    const styles = getComponentStyle('inventory') as typeof InventoryPageStyles;

    const [items, setItems]               = useState<Inventory[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
    const [formData, setFormData]         = useState<InventoryForm>({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete]         = useState<Inventory | null>(null);
    const [qrItem, setQrItem]             = useState<Inventory | null>(null);
    const [qrSize, setQrSize]             = useState(220);

    const fetchItems = async () => {
        setLoading(true);
        try { const r = await inventoryAPI.getAll(); setItems(r.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchItems(); }, []);

    const openAdd = () => { setSelectedItem(null); setFormData({ ...emptyForm }); setIsModalOpen(true); };
    const openEdit = (item: Inventory) => {
        setSelectedItem(item);
        setFormData({
            itemName: item.itemName, category: item.category, brand: item.brand || '',
            model: item.model || '', serialNumber: item.serialNumber, status: item.status,
            baseRentalPrice: item.baseRentalPrice,
            purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedItem) { await inventoryAPI.update(selectedItem._id, formData); }
            else { await inventoryAPI.create(formData); }
            fetchItems();
            setIsModalOpen(false);
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            alert(e.response?.data?.message || 'Action failed');
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try { await inventoryAPI.delete(toDelete._id); fetchItems(); setIsDeleteOpen(false); }
        catch { alert('Delete failed'); }
    };

    const filtered = items.filter(i => {
        const q = search.toLowerCase();
        return (i.itemName.toLowerCase().includes(q) ||
                i.serialNumber.toLowerCase().includes(q) ||
                (i.brand || '').toLowerCase().includes(q)) &&
               (filterStatus === 'All' || i.status === filterStatus);
    });

    const openQR = (item: Inventory) => { setQrItem(item); setQrSize(220); };

    // Navigate to scanner page with this item pre-highlighted
    const scanNow = (item: Inventory) => {
        navigate('/admin/scanner', { state: { prefillQR: item.qrCodeId } });
    };

    if (loading && items.length === 0) return <div style={{ padding: 20, color: '#64748b' }}>Loading inventory...</div>;

    const qrPayload = qrItem ? encodeURIComponent(buildQRPayload(qrItem)) : '';
    const qrSrc     = qrItem ? `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&margin=1&data=${qrPayload}` : '';

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Inventory</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{items.length} items total</p>
                </div>
                <button style={styles.actionButton} onClick={openAdd}>+ Add Item</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input placeholder="Search name, serial, brand…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ ...FormStyles.input, maxWidth: 300 }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ ...FormStyles.select, maxWidth: 180 }}>
                    <option value="All">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={layoutStyles.tableWrap}>
                <table style={layoutStyles.table}>
                    <thead>
                        <tr>
                            {['Item Name','Category','Brand / Model','Serial #','Status','Daily Rate','Notes','Actions'].map(h => (
                                <th key={h} style={layoutStyles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(item => (
                            <tr key={item._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                <td style={{ ...layoutStyles.td, fontWeight: 600 }}>{item.itemName}</td>
                                <td style={layoutStyles.td}>{item.category}</td>
                                <td style={layoutStyles.td}>{[item.brand, item.model].filter(Boolean).join(' — ') || '—'}</td>
                                <td style={{ ...layoutStyles.td, fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{item.serialNumber}</td>
                                <td style={layoutStyles.td}><span style={statusStyle(item.status)}>{item.status}</span></td>
                                <td style={layoutStyles.td}>Rs. {item.baseRentalPrice}/day</td>
                                <td style={{ ...layoutStyles.td, fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                                    {item.notes || '—'}
                                </td>
                                <td style={layoutStyles.td}>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {/* QR button */}
                                        <button onClick={() => openQR(item)}
                                            style={{ border: 'none', background: '#6366f1', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            🔲 QR
                                        </button>
                                        {/* Direct scan shortcut */}
                                        {item.status === 'Available' && (
                                            <button onClick={() => scanNow(item)}
                                                style={{ border: 'none', background: '#0ea5e9', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                                📷 Scan
                                            </button>
                                        )}
                                        <button onClick={() => openEdit(item)}
                                            style={{ border: 'none', background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Edit
                                        </button>
                                        <button onClick={() => { setToDelete(item); setIsDeleteOpen(true); }}
                                            style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No items found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── QR Modal ── */}
            {qrItem && (
                <div style={ModalStyles.overlay} onClick={() => setQrItem(null)}>
                    <div style={{ ...ModalStyles.content, maxWidth: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ ...ModalStyles.title, margin: 0 }}>{qrItem.itemName}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setQrItem(null)}>✕</button>
                        </div>

                        {/* item info */}
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'left', border: '1px solid #e2e8f0' }}>
                            {[
                                ['Category',   qrItem.category],
                                ['Brand',      qrItem.brand || '—'],
                                ['Serial #',   qrItem.serialNumber],
                                ['Daily Rate', `Rs. ${qrItem.baseRentalPrice}`],
                                ['QR Code ID', qrItem.qrCodeId],
                                ['Status',     qrItem.status],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>{k}</span>
                                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* QR image */}
                        <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 10, marginBottom: 14 }}>
                            <img src={qrSrc} alt="QR Code" width={qrSize} height={qrSize}
                                style={{ display: 'block', borderRadius: 4 }} />
                        </div>

                        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>
                            This QR encodes the item ID, name, serial and daily rate.<br />
                            Scan it in the QR Scanner page to auto-fill an invoice.
                        </p>

                        {/* size slider */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                QR Size: {qrSize}×{qrSize}px
                            </label>
                            <input type="range" min={120} max={400} step={20} value={qrSize}
                                onChange={e => setQrSize(Number(e.target.value))}
                                style={{ width: '100%', marginTop: 4 }} />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {/* Download button */}
                            <a href={qrSrc} download={`QR_${qrItem.serialNumber}.png`} target="_blank" rel="noreferrer"
                                style={{ ...FormStyles.submitButton, textDecoration: 'none', display: 'inline-block' }}>
                                ⬇ Download QR
                            </a>
                            {/* Go scan it */}
                            {qrItem.status === 'Available' && (
                                <button onClick={() => { setQrItem(null); scanNow(qrItem); }}
                                    style={{ ...FormStyles.submitButton, background: '#0ea5e9' }}>
                                    📷 Scan This Now
                                </button>
                            )}
                            <button style={FormStyles.cancelButton} onClick={() => setQrItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            {isModalOpen && (
                <div style={ModalStyles.overlay}>
                    <div style={ModalStyles.content}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>{selectedItem ? 'Edit Item' : 'Add Inventory Item'}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Item Name *</label>
                                    <input style={FormStyles.input} value={formData.itemName} required
                                        onChange={e => setFormData({ ...formData, itemName: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Category *</label>
                                    <select style={FormStyles.select} value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Brand</label>
                                    <input style={FormStyles.input} value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Model</label>
                                    <input style={FormStyles.input} value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Serial Number *</label>
                                    <input style={FormStyles.input} value={formData.serialNumber} required
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Daily Rental Price (Rs.) *</label>
                                    <input type="number" style={FormStyles.input} value={formData.baseRentalPrice} required min={0}
                                        onChange={e => setFormData({ ...formData, baseRentalPrice: Number(e.target.value) })} />
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Status</label>
                                    <select style={FormStyles.select} value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div style={FormStyles.group}>
                                    <label style={FormStyles.label}>Purchase Date</label>
                                    <input type="date" style={FormStyles.input} value={formData.purchaseDate}
                                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                </div>
                                <div style={{ ...FormStyles.group, gridColumn: '1 / -1' }}>
                                    <label style={FormStyles.label}>Notes</label>
                                    <textarea style={FormStyles.textarea} value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>
                            <div style={FormStyles.buttonRow}>
                                <button type="button" style={FormStyles.cancelButton} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" style={FormStyles.submitButton}>{selectedItem ? 'Save Changes' : 'Add Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmation
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                itemName={toDelete?.itemName || 'this item'}
            />
        </div>
    );
};

export default InventoryPage;
