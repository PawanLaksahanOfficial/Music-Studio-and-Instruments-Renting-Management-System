import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { statsAPI } from '../services/api';
import { CardStyles, FormStyles } from '../styles/AllStyles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Summary {
    totalRevenue: number;
    activeProductRentals: number;
    activeStudioRentals: number;
    overdueRentals: number;
    totalCustomers: number;
    totalInventoryItems: number;
    availableItems: number;
    rentedItems: number;
    pendingPayments: number;
    paidInvoices: number;
    pendingInvoices: number;
}

interface Monthly {
    month: string;
    productRentalRevenue: number;
    studioRentalRevenue: number;
    totalBookings: number;
}

const StatsPage: React.FC = () => {
    useContext(StyleContext);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthly, setMonthly] = useState<Monthly[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const [sRes, mRes] = await Promise.all([statsAPI.getSummary(), statsAPI.getMonthly()]);
                setSummary(sRes.data);
                setMonthly(mRes.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const generatePDF = () => {
        if (!summary) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('ELVI Music Studio - Business Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        if (dateRange.start || dateRange.end) {
            doc.text(`Range: ${dateRange.start || 'Start'} to ${dateRange.end || 'Now'}`, 14, 36);
        }

        const summaryData = [
            ['Total Revenue', `Rs. ${summary.totalRevenue.toLocaleString()}`],
            ['Active Product Rentals', summary.activeProductRentals],
            ['Active Studio Bookings', summary.activeStudioRentals],
            ['Overdue Rentals', summary.overdueRentals],
            ['Total Customers', summary.totalCustomers],
            ['Total Inventory Items', summary.totalInventoryItems],
            ['Pending Payments', `Rs. ${summary.pendingPayments.toLocaleString()}`],
            ['Paid Invoices', summary.paidInvoices],
            ['Pending Invoices', summary.pendingInvoices],
        ];

        autoTable(doc, {
            startY: 45,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        if (monthly.length > 0) {
            const monthlyData = monthly.map(m => [
                m.month,
                `Rs. ${m.productRentalRevenue}`,
                `Rs. ${m.studioRentalRevenue}`,
                `Rs. ${m.productRentalRevenue + m.studioRentalRevenue}`
            ]);

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 15,
                head: [['Month', 'Product Revenue', 'Studio Revenue', 'Total']],
                body: monthlyData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] }
            });
        }

        doc.save('ELVI_Studio_Report.pdf');
    };

    if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading statistics...</div>;
    if (!summary) return <div style={{ padding: '20px', color: '#ef4444' }}>Failed to load stats.</div>;

    const maxRevenue = Math.max(...monthly.map(m => m.productRentalRevenue + m.studioRentalRevenue), 1);

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Statistics</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Overview of business performance</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>From</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            style={{ ...FormStyles.input, margin: 0, padding: '4px 8px', fontSize: '12px', width: '130px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>To</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            style={{ ...FormStyles.input, margin: 0, padding: '4px 8px', fontSize: '12px', width: '130px' }} />
                    </div>
                    <button onClick={generatePDF}
                        style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        📥 Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={CardStyles.grid}>
                {[
                    { label: 'Total Revenue', value: `Rs. ${summary.totalRevenue.toLocaleString()}`, sub: 'All time', color: '#3b82f6' },
                    { label: 'Active Rentals', value: summary.activeProductRentals, sub: 'Products out', color: '#10b981' },
                    { label: 'Active Studios', value: summary.activeStudioRentals, sub: 'Confirmed bookings', color: '#06b6d4' },
                    { label: 'Overdue', value: summary.overdueRentals, sub: 'Need attention', color: '#ef4444' },
                    { label: 'Customers', value: summary.totalCustomers, sub: 'Registered', color: '#8b5cf6' },
                    { label: 'Inventory', value: summary.totalInventoryItems, sub: `${summary.availableItems} available, ${summary.rentedItems} rented`, color: '#f59e0b' },
                    { label: 'Paid Invoices', value: summary.paidInvoices, sub: `${summary.pendingInvoices} pending`, color: '#10b981' },
                    { label: 'Pending Payments', value: `Rs. ${summary.pendingPayments.toLocaleString()}`, sub: 'To collect', color: '#f59e0b' },
                ].map(card => (
                    <div key={card.label} style={{ ...CardStyles.card, borderTop: `3px solid ${card.color}` }}>
                        <div style={CardStyles.cardLabel}>{card.label}</div>
                        <div style={{ ...CardStyles.cardValue, color: card.color }}>{card.value}</div>
                        <div style={CardStyles.cardSub}>{card.sub}</div>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            {monthly.length > 0 && (
                <div style={{ ...CardStyles.card, marginTop: '8px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Monthly Revenue (Last 6 Months)</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '0 8px' }}>
                        {monthly.map((m, idx) => {
                            const total = m.productRentalRevenue + m.studioRentalRevenue;
                            const barH = Math.round((total / maxRevenue) * 160);
                            const prH = Math.round((m.productRentalRevenue / maxRevenue) * 160);
                            const srH = barH - prH;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Rs.{total}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '50px' }}>
                                        <div style={{ height: `${srH}px`, background: '#06b6d4', borderRadius: '3px 3px 0 0', minHeight: srH > 0 ? '4px' : '0' }} title={`Studio: Rs.${m.studioRentalRevenue}`} />
                                        <div style={{ height: `${prH}px`, background: '#3b82f6', minHeight: prH > 0 ? '4px' : '0' }} title={`Products: Rs.${m.productRentalRevenue}`} />
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>{m.month}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                            <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }} /> Product Rentals
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                            <div style={{ width: '12px', height: '12px', background: '#06b6d4', borderRadius: '2px' }} /> Studio Rentals
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Breakdown */}
            <div style={{ ...CardStyles.card, marginTop: '16px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Inventory Availability</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Available', value: summary.availableItems, color: '#10b981', bg: '#d1fae5' },
                        { label: 'Rented Out', value: summary.rentedItems, color: '#3b82f6', bg: '#dbeafe' },
                        { label: 'In Maintenance', value: summary.totalInventoryItems - summary.availableItems - summary.rentedItems, color: '#f59e0b', bg: '#fef3c7' },
                    ].map(item => (
                        <div key={item.label} style={{ flex: 1, minWidth: '160px', background: item.bg, borderRadius: '10px', padding: '16px 20px' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>{item.value}</div>
                            <div style={{ fontSize: '13px', color: item.color, fontWeight: 600 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
