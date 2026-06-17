import React, { useEffect, useState } from 'react';
import { customersAPI } from '../services/api';
import { ArchivedCustomersStyles as styles } from '../styles/ArchivedCustomersStyles';

const ArchivedCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await customersAPI.getArchived();
            setCustomers(res.data);
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
            await customersAPI.restore(id); 
            fetch(); 
        }
        catch { 
            alert('Restore failed'); 
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Permanently delete this archived customer? This cannot be undone.')) return;
        try { 
            await customersAPI.delete(id);
            fetch(); 
        }
        catch { 
            alert('Delete failed'); 
        }
    };

    if (loading) return <div style={styles.loading}>Loading archived customers...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Archived Customers</h2>
                    <p style={styles.subtitle}>{customers.length} archived customer records</p>
                </div>
            </div>
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Phone</th>
                            <th style={styles.th}>NIC / Passport</th>
                            <th style={styles.th}>Archived</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length > 0 ? customers.map((c: any) => (
                            <tr key={c._id}>
                                <td style={{ ...styles.td, ...styles.tdBold }}>{c.firstName} {c.lastName}</td>
                                <td style={styles.td}>{c.phone}</td>
                                <td style={{ ...styles.td, ...styles.tdMonospace }}>{c.nicOrPassport}</td>
                                <td style={{ ...styles.td, ...styles.tdSmall }}>
                                    {c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : '—'}
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => handleRestore(c._id)} style={styles.restoreButton}>Restore</button>
                                        <button onClick={() => handleDelete(c._id)} style={styles.deleteButton}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} style={styles.noData}>No archived customers.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ArchivedCustomers;