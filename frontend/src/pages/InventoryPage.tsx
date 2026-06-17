import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StyleContext } from '../context/StyleContext';
import { inventoryAPI } from '../services/api';
import Inventory from '../types/Inventory';
import DeleteConfirmation from '../components/DeleteConfirmation';
import ArchiveConfirmation from '../components/ArchiveConfirmation';
import { useAuth } from '../context/AuthContext';
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import { InventoryPageStyles } from '../styles/InventoryPageStyles';
import { ModalStyles, FormStyles } from '../styles/AllStyles';
import { StatusBadge } from '../styles/DesignTokens';

const CATEGORIES = ['Instruments', 'Audio Gear', 'Cables', 'Other'];
const STATUSES   = ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'];

type Category = typeof CATEGORIES[number];
type Status = typeof STATUSES[number];

interface InventoryForm {
    itemName: string;
    category: Category;
    brand: string;
    model: string;
    serialNumber: string;
    status: Status;
    baseRentalPrice: number;
    purchaseDate: string;
    notes: string;
}

const emptyForm: InventoryForm = {
    itemName: '',
    category: 'Instruments', 
    brand: '', 
    model: '',
    serialNumber: '', 
    status: 'Available', 
    baseRentalPrice: 0, 
    purchaseDate: '',
    notes: '',
};

const statusStyle = (s: string) => {
    const map: Record<string, React.CSSProperties> = {
        Available: StatusBadge.available, Rented: StatusBadge.rented,
        Maintenance: StatusBadge.maintenance, Damaged: StatusBadge.damaged, Lost: StatusBadge.lost,
    };
    return map[s] || StatusBadge.lost;
};

const buildQRPayload = (item: Inventory) =>
    `${item.qrCodeId}|${item.itemName}|${item.serialNumber}|${item.baseRentalPrice}`;

const InventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle('inventory') as typeof InventoryPageStyles;
    const { isAdmin } = useAuth();
    const [items, setItems] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
    const [formData, setFormData] = useState<InventoryForm>({ ...emptyForm });
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<Inventory | null>(null);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [toArchive, setToArchive] = useState<Inventory | null>(null);
    const [qrItem, setQrItem] = useState<Inventory | null>(null);
    const [qrSize, setQrSize] = useState(220);

    const fetchItems = async () => {
        setLoading(true);
        try { 
            const r = await inventoryAPI.getAll(); 
            setItems(r.data); 
        }
        catch (e) { 
            console.error(e); 
        }
        finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
         fetchItems(); 
    }, []);

    const openAdd = () => { 
        setSelectedItem(null); 
        setFormData({ ...emptyForm }); 
        setIsModalOpen(true); 
    };

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
        try { 
            await inventoryAPI.delete(toDelete._id); 
            fetchItems(); 
            setIsDeleteOpen(false); 
        }
        catch { 
            alert('Delete failed'); 
        }
    };

    const confirmArchive = async () => {
        if (!toArchive) return;
        try { 
            await inventoryAPI.archive(toArchive._id); 
            fetchItems(); 
            setIsArchiveOpen(false); 
        }
        catch { 
            alert('Archive failed'); 
        }
    };

    const filtered = items.filter(i => {
        const q = search.toLowerCase();
        return (i.itemName.toLowerCase().includes(q) ||
                i.serialNumber.toLowerCase().includes(q) ||
                (i.brand || '').toLowerCase().includes(q)) &&
               (filterStatus === 'All' || i.status === filterStatus);
    });

    const openQR = (item: Inventory) => { 
        setQrItem(item); 
        setQrSize(220); 
    };

    const scanNow = (item: Inventory) => {
        navigate('/admin/scanner', { state: { prefillQR: item.qrCodeId } });
    };

    if (loading && items.length === 0) return <div style={styles.loading}>Loading inventory...</div>;

    const qrPayload = qrItem ? encodeURIComponent(buildQRPayload(qrItem)) : '';
    const qrSrc = qrItem ? `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&margin=1&data=${qrPayload}` : '';

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h2 style={styles.title}>Inventory</h2>
                    <p style={styles.subtitle}>{items.length} items total</p>
                </div>
                <button style={styles.actionButton} onClick={openAdd}>+ Add Item</button>
            </div>

            <div style={styles.filterRow}>
                <input placeholder="Search name, serial, brand…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={styles.searchInput} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={styles.statusSelect}>
                    <option value="All">All Statuses</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {['Item Name','Category','Brand / Model','Serial #','Status','Daily Rate','Notes','Actions'].map(h => (
                                <th key={h} style={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(item => (
                            <tr key={item._id}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                <td style={{ ...styles.td, ...styles.tdBold }}>{item.itemName}</td>
                                <td style={styles.td}>{item.category}</td>
                                <td style={styles.td}>{[item.brand, item.model].filter(Boolean).join(' — ') || '—'}</td>
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{item.serialNumber}</td>
                                <td style={styles.td}><span style={statusStyle(item.status)}>{item.status}</span></td>
                                <td style={styles.td}>Rs. {item.baseRentalPrice}/day</td>
                                <td style={{ ...styles.td, ...styles.tdNotes }} title={item.notes}>
                                    {item.notes || '—'}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => openQR(item)}
                                            style={styles.qrButton}>
                                            🔲 QR
                                        </button>
                                        {item.status === 'Available' && (
                                            <button onClick={() => scanNow(item)}
                                                style={styles.scanButton}>
                                                📷 Scan
                                            </button>
                                        )}
                                        <button onClick={() => { setToArchive(item); setIsArchiveOpen(true); }}
                                            style={styles.archiveButton}>
                                            Archive
                                        </button>
                                        <button onClick={() => openEdit(item)}
                                            style={styles.editButton}>
                                            Edit
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => { setToDelete(item); setIsDeleteOpen(true); }}
                                                style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={7} style={styles.noItems}>No items found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* QR Modal */}
            {qrItem && (
                <div style={styles.overlay} onClick={() => setQrItem(null)}>
                    <div style={styles.qrModalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.qrModalTitleRow}>
                            <h3 style={styles.qrModalTitle}>{qrItem.itemName}</h3>
                            <button style={styles.qrModalCloseBtn} onClick={() => setQrItem(null)}>✕</button>
                        </div>
                        <div style={styles.itemInfoBox}>
                            {[
                                ['Category', qrItem.category],
                                ['Brand', qrItem.brand || '—'],
                                ['Serial #', qrItem.serialNumber],
                                ['Daily Rate', `Rs. ${qrItem.baseRentalPrice}`],
                                ['QR Code ID', qrItem.qrCodeId],
                                ['Status', qrItem.status],
                            ].map(([k, v]) => (
                                <div key={k} style={styles.infoRow}>
                                    <span style={styles.infoLabel}>{k}</span>
                                    <span style={styles.infoValue}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <div style={styles.qrImageWrapper}>
                            <img src={qrSrc} alt="QR Code" width={qrSize} height={qrSize}
                                style={styles.qrImage} />
                        </div>
                        <p style={styles.qrDescription}>
                            This QR encodes the item ID, name, serial and daily rate.<br />
                            Scan it in the QR Scanner page to auto-fill an invoice.
                        </p>
                        <div style={styles.sizeControl}>
                            <label style={styles.sizeLabel}>QR Size: {qrSize}×{qrSize}px</label>
                            <input type="range" min={120} max={400} step={20} value={qrSize}
                                onChange={e => setQrSize(Number(e.target.value))}
                                style={styles.sizeSlider} />
                        </div>
                        <div style={styles.qrActionGroup}>
                            <a href={qrSrc} download={`QR_${qrItem.serialNumber}.png`} target="_blank" rel="noreferrer"
                                style={styles.downloadBtn}>
                                ⬇ Download QR
                            </a>
                            {qrItem.status === 'Available' && (
                                <button onClick={() => { setQrItem(null); scanNow(qrItem); }}
                                    style={styles.scanNowBtn}>
                                    📷 Scan This Now
                                </button>
                            )}
                            <button style={FormStyles.cancelButton} onClick={() => setQrItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div style={styles.overlay}>
                    <div style={ModalStyles.content}>
                        <div style={ModalStyles.titleRow}>
                            <h3 style={ModalStyles.title}>{selectedItem ? 'Edit Item' : 'Add Inventory Item'}</h3>
                            <button style={ModalStyles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={FormStyles.grid2}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Item Name *</label>
                                    <input style={FormStyles.input} value={formData.itemName} required
                                        onChange={e => setFormData({ ...formData, itemName: e.target.value })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Category *</label>
                                    <select style={FormStyles.select} value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as InventoryForm['category'] })}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Brand</label>
                                    <input style={FormStyles.input} value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Model</label>
                                    <input style={FormStyles.input} value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Serial Number *</label>
                                    <input style={FormStyles.input} value={formData.serialNumber} required
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Daily Rental Price (Rs.) *</label>
                                    <input type="number" style={FormStyles.input} value={formData.baseRentalPrice === 0 ? '' : formData.baseRentalPrice} required min={0}
                                        onChange={e => setFormData({ ...formData, baseRentalPrice: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Status</label>
                                    <select style={FormStyles.select} value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as InventoryForm['status'] })}>
                                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Purchase Date</label>
                                    <input type="date" style={FormStyles.input} value={formData.purchaseDate}
                                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                </div>
                                <div style={styles.fullWidthGroup}>
                                    <label style={styles.formLabel}>Notes</label>
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

            <ArchiveConfirmation
                isOpen={isArchiveOpen}
                onClose={() => setIsArchiveOpen(false)}
                onConfirm={confirmArchive}
                itemName={toArchive?.itemName || 'this item'}
            />
            {isAdmin && (
                <DeleteConfirmation
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={confirmDelete}
                    itemName={toDelete?.itemName || 'this item'}
                />
            )}
        </div>
    );
};

export default InventoryPage;