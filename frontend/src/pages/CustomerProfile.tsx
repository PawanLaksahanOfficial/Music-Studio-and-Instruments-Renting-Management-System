import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersAPI } from '../services/api';
import { CustomerProfileStyles as s } from '../styles/CustomerProfileStyles';

interface ProfileData {
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone: string;
        nicOrPassport: string;
        isBlacklisted: boolean;
        createdAt: string;
    };
    stats: {
        totalRentals: number;
        totalSpending: number;
        lastRentalDate: string | null;
        outstandingFines: number;
    };
    rentalHistory: Array<{
        _id: string;
        rentalId: string;
        items: Array<{ itemId: { itemName: string; serialNumber: string } }>;
        rentalDate: string;
        dueDate: string;
        returnDate?: string;
        status: string;
        totalAmount: number;
        paymentStatus: string;
        lateFee: number;
        damageCharges: number;
        damageNotes: string;
    }>;
}

const fmtDate = (d: string | Date) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currency = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const statusBadgeStyle = (st: string) => {
    const map: Record<string, [string, string]> = {
        Rented: ['#fef3c7', '#92400e'],
        Returned: ['#d1fae5', '#065f46'],
        Overdue: ['#fee2e2', '#991b1b'],
    };
    const [bg, color] = map[st] || ['#f1f5f9', '#475569'];
    return s.statusBadge(bg, color);
};

const payBadgeStyle = (st: string) => {
    const map: Record<string, [string, string]> = {
        Paid: ['#d1fae5', '#065f46'],
        Pending: ['#fef3c7', '#92400e'],
        Partial: ['#fef3c7', '#92400e'],
    };
    const [bg, color] = map[st] || ['#f1f5f9', '#475569'];
    return s.payBadge(bg, color);
};

const blacklistBadge = (isBlacklisted: boolean) =>
    s.statusBadge(isBlacklisted ? '#fee2e2' : '#d1fae5', isBlacklisted ? '#991b1b' : '#065f46');

const CustomerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        customersAPI.getProfile(id)
            .then(res => setProfile(res.data))
            .catch(() => alert('Failed to load customer profile'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={s.loading}>Loading customer profile...</div>;
    if (!profile) return <div style={s.loading}>Customer not found.</div>;

    const { customer, stats, rentalHistory } = profile;

    return (
        <div style={s.container}>
            <div style={s.pageHeader}>
                <div>
                    <h2 style={s.pageTitle}>👤 {customer.firstName} {customer.lastName}</h2>
                    <p style={s.pageSub}>Customer Profile & Rental History</p>
                </div>
                <button onClick={() => navigate('/admin/customers')} style={s.ghostBtn}>
                    ← Back to Customers
                </button>
            </div>
            <div style={s.card}>
                <div style={s.headerRow}>
                    <h3 style={s.sectionTitle}>Customer Details</h3>
                    <span style={blacklistBadge(customer.isBlacklisted)}>
                        {customer.isBlacklisted ? 'Blacklisted' : 'Active'}
                    </span>
                </div>
                <div style={s.profileGrid}>
                    <div>
                        <div style={s.label}>Full Name</div>
                        <div style={s.value}>{customer.firstName} {customer.lastName}</div>
                    </div>
                    <div>
                        <div style={s.label}>Phone</div>
                        <div style={s.value}>{customer.phone}</div>
                    </div>
                    <div>
                        <div style={s.label}>Email</div>
                        <div style={s.value}>{customer.email || '—'}</div>
                    </div>
                    <div>
                        <div style={s.label}>NIC / Passport</div>
                        <div style={s.value}>{customer.nicOrPassport}</div>
                    </div>
                    <div>
                        <div style={s.label}>Registered Since</div>
                        <div style={s.value}>{fmtDate(customer.createdAt)}</div>
                    </div>
                </div>
            </div>
            <div style={s.card}>
                <h3 style={s.sectionTitle}>📊 Rental Statistics</h3>
                <div style={s.statsGrid}>
                    <div style={s.statCard}>
                        <div style={s.statNumber}>{stats.totalRentals}</div>
                        <div style={s.statLabel}>Total Rentals</div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statNumber}>{currency(stats.totalSpending)}</div>
                        <div style={s.statLabel}>Total Spending</div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statNumber}>{stats.lastRentalDate ? fmtDate(stats.lastRentalDate) : '—'}</div>
                        <div style={s.statLabel}>Last Rental Date</div>
                    </div>
                    <div style={s.statCard}>
                        <div style={stats.outstandingFines > 0 ? s.statNumberDanger : s.statNumberSuccess}>
                            {stats.outstandingFines > 0 ? currency(stats.outstandingFines) : 'Rs. 0'}
                        </div>
                        <div style={s.statLabel}>Outstanding Fines</div>
                    </div>
                </div>
            </div>
            <div style={s.card}>
                <h3 style={s.sectionTitle}>📋 Rental History ({rentalHistory.length} records)</h3>
                <div style={s.tableWrapper}>
                    {rentalHistory.length > 0 ? (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Rental ID</th>
                                    <th style={s.th}>Item</th>
                                    <th style={s.th}>Rental Date</th>
                                    <th style={s.th}>Due Date</th>
                                    <th style={s.th}>Returned</th>
                                    <th style={s.th}>Status</th>
                                    <th style={s.th}>Amount</th>
                                    <th style={s.th}>Payment</th>
                                    <th style={s.th}>Late Fee</th>
                                    <th style={s.th}>Damage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rentalHistory.map(r => (
                                    <tr key={r._id}>
                                        <td style={{ ...s.td, ...s.tdBold }}>{r.rentalId}</td>
                                        <td style={s.td}>{r.items[0]?.itemId?.itemName || 'N/A'}</td>
                                        <td style={s.td}>{fmtDate(r.rentalDate)}</td>
                                        <td style={s.td}>{fmtDate(r.dueDate)}</td>
                                        <td style={s.td}>{r.returnDate ? fmtDate(r.returnDate) : '—'}</td>
                                        <td style={s.td}><span style={statusBadgeStyle(r.status)}>{r.status}</span></td>
                                        <td style={{ ...s.td, ...s.tdBold }}>{currency(r.totalAmount)}</td>
                                        <td style={s.td}><span style={payBadgeStyle(r.paymentStatus)}>{r.paymentStatus}</span></td>
                                        <td style={{ ...s.td, ...s.fineAmount }}>{r.lateFee > 0 ? currency(r.lateFee) : '—'}</td>
                                        <td style={s.td}>{r.damageCharges > 0 ? currency(r.damageCharges) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={s.noData}>No rental history found for this customer.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;