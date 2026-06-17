import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI } from '../services/api';
import Inventory from '../types/Inventory';
import { DamagedInventoryStyles as s } from '../styles/DamagedInventoryStyles';

const fmtDate = (d: string | Date | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currency = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const DamagedInventory: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDamaged = async () => {
        setLoading(true);
        try {
            const res = await inventoryAPI.getDamaged();
            setItems(res.data);
        } catch (err) {
            console.error('Failed to fetch damaged inventory', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDamaged(); }, []);

    const markAsAvailable = async (item: Inventory) => {
        if (!window.confirm(`Mark "${item.itemName}" (${item.serialNumber}) as Available?`)) return;
        try {
            await inventoryAPI.update(item._id, { status: 'Available' });
            fetchDamaged();
        } catch {
            alert('Failed to update item status');
        }
    };

    const markAsMaintenance = async (item: Inventory) => {
        if (!window.confirm(`Send "${item.itemName}" (${item.serialNumber}) to Maintenance?`)) return;
        try {
            await inventoryAPI.update(item._id, { status: 'Maintenance' });
            fetchDamaged();
        } catch {
            alert('Failed to update item status');
        }
    };

    if (loading && items.length === 0) return <div style={s.loading}>Loading damaged inventory...</div>;

    return (
        <div style={s.container}>
            <div style={s.pageHeader}>
                <div>
                    <h2 style={s.pageTitle}>🔧 Damaged Inventory</h2>
                    <p style={s.pageSub}>Manage instruments that have been marked as damaged during returns</p>
                </div>
                <button onClick={() => navigate('/admin/inventory')} style={s.ghostBtn}>
                    ← All Inventory
                </button>
            </div>
            <div style={s.statsRow}>
                <div style={s.statBox}>
                    <div style={s.statNumber}>{items.length}</div>
                    <div style={s.statLabel}>Damaged Items</div>
                </div>
                <div style={s.statBoxGreen}>
                    <div style={s.statNumberGreen}>
                        {items.reduce((sum, i) => sum + (i.baseRentalPrice || 0), 0)}
                    </div>
                    <div style={s.statLabel}>Total Value at Risk (Rs.)</div>
                </div>
            </div>
            <div style={s.card}>
                <div style={s.tableWrapper}>
                    {items.length > 0 ? (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Item Name</th>
                                    <th style={s.th}>Brand</th>
                                    <th style={s.th}>Serial Number</th>
                                    <th style={s.th}>Category</th>
                                    <th style={s.th}>Status</th>
                                    <th style={s.th}>Price</th>
                                    <th style={s.th}>Last Updated</th>
                                    <th style={s.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item._id}>
                                        <td style={{ ...s.td, ...s.tdBold }}>{item.itemName}</td>
                                        <td style={s.td}>{item.brand || '—'}</td>
                                        <td style={s.td}>{item.serialNumber}</td>
                                        <td style={s.td}>{item.category}</td>
                                        <td style={s.td}><span style={s.statusBadge}>Damaged</span></td>
                                        <td style={s.td}>{currency(item.baseRentalPrice)}</td>
                                        <td style={s.td}>{fmtDate(item.purchaseDate)}</td>
                                        <td style={s.td}>
                                            <button onClick={() => markAsAvailable(item)} style={s.actionBtn}>
                                                ✅ Available
                                            </button>
                                            <button onClick={() => markAsMaintenance(item)} style={s.actionBtnOrange}>
                                                🔧 Maintenance
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={s.noData}>✅ No damaged items found. All instruments are in good condition.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DamagedInventory;