import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { rentalsAPI, studioRentalsAPI } from '../services/api';
import { ArchivedRentalsStyles as styles } from '../styles/ArchivedRentalsStyles';

const ArchivedRentals: React.FC = () => {
    const [productRentals, setProductRentals] = useState<any[]>([]);
    const [studioRentals, setStudioRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const [prRes, srRes] = await Promise.all([
                rentalsAPI.getArchived(),
                studioRentalsAPI.getArchived(),
            ]);
            setProductRentals(prRes.data);
            setStudioRentals(srRes.data);
        } 
        catch (e) { 
            console.error(e); 
        }
        finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetch(); }, []);

    const handleRestore = async (type: 'product' | 'studio', id: string) => {
        try {
            if (type === 'product') await rentalsAPI.restore(id);
            else await studioRentalsAPI.restore(id);
            fetch();
        } catch { 
            alert('Restore failed'); 
        }
    };

    const handleDelete = async (type: 'product' | 'studio', id: string) => {
        if (!window.confirm('Permanently delete this archived record? This cannot be undone.')) return;
        try {
            if (type === 'product') await rentalsAPI.delete(id);
            else await studioRentalsAPI.delete(id);
            fetch();
        } catch {
            alert('Delete failed'); 
        }
    };

    if (loading) return <div style={styles.loading}>Loading archived records...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Archived Rentals</h2>
                    <p style={styles.subtitle}>View and manage archived rental records</p>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Archived Product Rentals ({productRentals.length})</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Rental ID</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Items</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Archived</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productRentals.length > 0 ? productRentals.map((r: any) => (
                                <tr key={r._id}>
                                    <td style={{ ...styles.td, ...styles.tdMonospace }}>{r.rentalId}</td>
                                    <td style={{ ...styles.td, ...styles.tdBold }}>
                                        {r.customer?.firstName} {r.customer?.lastName}
                                    </td>
                                    <td style={styles.td}>
                                        {r.items?.map((i: any) => i.itemId?.itemName).join(', ') || '—'}
                                    </td>
                                    <td style={styles.td}>{r.status}</td>
                                    <td style={{ ...styles.td, ...styles.tdSmall }}>
                                        {r.archivedAt ? new Date(r.archivedAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionGroup}>
                                            <button onClick={() => handleRestore('product', r._id)}
                                                style={styles.restoreButton}>
                                                Restore
                                            </button>
                                            <button onClick={() => handleDelete('product', r._id)}
                                                style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} style={styles.noData}>No archived product rentals.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Archived Studio Rentals ({studioRentals.length})</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Booking ID</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Room</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Archived</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studioRentals.length > 0 ? studioRentals.map((r: any) => (
                                <tr key={r._id}>
                                    <td style={{ ...styles.td, ...styles.tdMonospace }}>{r.bookingId}</td>
                                    <td style={{ ...styles.td, ...styles.tdBold }}>
                                        {r.customer?.firstName} {r.customer?.lastName}
                                    </td>
                                    <td style={styles.td}>{r.roomName}</td>
                                    <td style={styles.td}>{r.status}</td>
                                    <td style={{ ...styles.td, ...styles.tdSmall }}>
                                        {r.archivedAt ? new Date(r.archivedAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionGroup}>
                                            <button onClick={() => handleRestore('studio', r._id)}
                                                style={styles.restoreButton}>
                                                Restore
                                            </button>
                                            <button onClick={() => handleDelete('studio', r._id)}
                                                style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} style={styles.noData}>No archived studio rentals.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ArchivedRentals;