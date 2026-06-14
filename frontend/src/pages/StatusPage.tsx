import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { statsAPI } from '../services/api';
import { FormStyles } from '../styles/AllStyles';
import { StatusPageStyles as styles } from '../styles/StatusPageStyles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type extension for jsPDF instance with autoTable plugin properties
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

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
                const [sRes, mRes] = await Promise.all([
                    statsAPI.getSummary(dateRange),
                    statsAPI.getMonthly(dateRange)
                ]);
                setSummary(sRes.data);
                setMonthly(mRes.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [dateRange]);

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
                startY: (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 15,
                head: [['Month', 'Product Revenue', 'Studio Revenue', 'Total']],
                body: monthlyData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] }
            });
        }

        doc.save('ELVI_Studio_Report.pdf');
    };

    if (loading) return <div style={styles.loading}>Loading statistics...</div>;
    if (!summary) return <div style={styles.error}>Failed to load stats.</div>;

    const maxRevenue = Math.max(...monthly.map(m => m.productRentalRevenue + m.studioRentalRevenue), 1);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Statistics</h2>
                    <p style={styles.subtitle}>Overview of business performance</p>
                </div>
                <div style={styles.actionRow}>
                    <div style={styles.dateGroup}>
                        <label style={styles.dateLabel}>From</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            style={styles.dateInput} />
                    </div>
                    <div style={styles.dateGroup}>
                        <label style={styles.dateLabel}>To</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            style={styles.dateInput} />
                    </div>
                    <button onClick={generatePDF} style={styles.exportButton}>
                        📥 Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={styles.cardGrid}>
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
                    <div key={card.label} style={styles.card(card.color)}>
                        <div style={styles.cardLabel}>{card.label}</div>
                        <div style={styles.cardValue(card.color)}>{card.value}</div>
                        <div style={styles.cardSub}>{card.sub}</div>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            {monthly.length > 0 && (
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Monthly Revenue (Last 6 Months)</h3>
                    <div style={styles.chartWrapper}>
                        {monthly.map((m, idx) => {
                            const total = m.productRentalRevenue + m.studioRentalRevenue;
                            const barH = Math.round((total / maxRevenue) * 160);
                            const prH = Math.round((m.productRentalRevenue / maxRevenue) * 160);
                            const srH = barH - prH;
                            return (
                                <div key={idx} style={styles.chartBarContainer}>
                                    <div style={styles.chartBarValue}>Rs.{total}</div>
                                    <div style={styles.chartBarStack}>
                                        <div style={styles.chartBarStudio(srH)} title={`Studio: Rs.${m.studioRentalRevenue}`} />
                                        <div style={styles.chartBarProduct(prH)} title={`Products: Rs.${m.productRentalRevenue}`} />
                                    </div>
                                    <div style={styles.chartBarLabel}>{m.month}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={styles.chartLegend}>
                        <div style={styles.legendItem}>
                            <div style={styles.legendColor('#3b82f6')} /> Product Rentals
                        </div>
                        <div style={styles.legendItem}>
                            <div style={styles.legendColor('#06b6d4')} /> Studio Rentals
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Breakdown */}
            <div style={styles.inventoryCard}>
                <h3 style={styles.inventoryTitle}>Inventory Availability</h3>
                <div style={styles.inventoryGrid}>
                    {[
                        { label: 'Available', value: summary.availableItems, color: '#10b981', bg: '#d1fae5' },
                        { label: 'Rented Out', value: summary.rentedItems, color: '#3b82f6', bg: '#dbeafe' },
                        { label: 'In Maintenance', value: summary.totalInventoryItems - summary.availableItems - summary.rentedItems, color: '#f59e0b', bg: '#fef3c7' },
                    ].map(item => (
                        <div key={item.label} style={styles.inventoryItem(item.bg)}>
                            <div style={styles.inventoryValue(item.color)}>{item.value}</div>
                            <div style={styles.inventoryLabel(item.color)}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
