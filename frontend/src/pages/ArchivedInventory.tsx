import React, { useEffect, useState } from 'react';
import { inventoryAPI } from '../services/api';
import { ArchivedInventoryStyles as styles } from '../styles/ArchivedInventoryStyles';

const ArchivedInventory: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await inventoryAPI.getArchived();
            setItems(res.data);
        } catch (e) { 
            console.error(e); 
        }
        finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetch(); 
    }, []);

    const handleRestore = async (id: string) => {
        try { 
            await inventoryAPI.restore(id); 
            fetch(); 
        }
        catch { 
            alert('Restore failed'); 
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Permanently delete this archived item? This cannot be undone.')) return;
        try { 
            await inventoryAPI.delete(id); 
            fetch(); 
        }
        catch { 
            alert('Delete failed'); 
        }
    };

    if (loading) return <div style={styles.loading}>Loading archived inventory...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Archived Inventory</h2>
                    <p style={styles.subtitle}>{items.length} archived items</p>
                </div>
            </div>
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Item Name</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Serial #</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Archived</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? items.map((item: any) => (
                            <tr key={item._id}>
                                <td style={{ ...styles.td, ...styles.tdBold }}>{item.itemName}</td>
                                <td style={styles.td}>{item.category}</td>
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{item.serialNumber}</td>
                                <td style={styles.td}>{item.status}</td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>
                                    {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString() : '—'}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => handleRestore(item._id)} style={styles.restoreButton}>Restore</button>
                                        <button onClick={() => handleDelete(item._id)} style={styles.deleteButton}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} style={styles.noData}>No archived inventory items.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ArchivedInventory;