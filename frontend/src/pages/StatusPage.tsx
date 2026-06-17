import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import { statsAPI } from '../services/api';
import { FormStyles } from '../styles/AllStyles';
import { StatusPageStyles as s } from '../styles/StatusPageStyles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
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

interface DashboardData {
    mostRentedInstruments: Array<{
        itemName: string;
        brand: string;
        serialNumber: string;
        rentalCount: number;
        totalRevenue: number;
    }>;
    lateReturns: {
        records: Array<{
            customerName: string;
            lateDays: number;
            lateFee: number;
            totalAmount: number;
            rentalDate: string;
            dueDate: string;
            returnDate: string;
        }>;
        totalLateReturns: number;
        totalLateFeeCollected: number;
        avgLateDays: number;
    };
    topCustomers: Array<{
        customerName: string;
        phone: string;
        totalRentals: number;
        totalSpent: number;
        totalLateFees: number;
        totalDamages: number;
    }>;
    damageTrend: Array<{
        month: string;
        charges: number;
        count: number;
    }>;
    rentalGrowth: Array<{
        month: string;
        newRentals: number;
        revenue: number;
    }>;
}

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currency = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const StatsPage: React.FC = () => {
    useContext(StyleContext);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [monthly, setMonthly] = useState<Monthly[]>([]);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const [sRes, mRes, dRes] = await Promise.all([
                    statsAPI.getSummary(dateRange),
                    statsAPI.getMonthly(dateRange),
                    statsAPI.getDashboard(dateRange),
                ]);
                setSummary(sRes.data);
                setMonthly(mRes.data);
                setDashboard(dRes.data);
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

        if (dashboard?.mostRentedInstruments?.length) {
            const rentedData = dashboard.mostRentedInstruments.slice(0, 5).map(i => [
                i.itemName || 'N/A',
                i.rentalCount,
                `Rs. ${i.totalRevenue}`
            ]);
            autoTable(doc, {
                startY: (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 15,
                head: [['Most Rented', 'Count', 'Revenue']],
                body: rentedData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] }
            });
        }

        doc.save('ELVI_Studio_Report.pdf');
    };

    if (loading) return <div style={s.loading}>Loading statistics...</div>;
    if (!summary) return <div style={s.error}>Failed to load stats.</div>;

    const maxRevenue = Math.max(...monthly.map(m => m.productRentalRevenue + m.studioRentalRevenue), 1);
    const maxRented = Math.max(...(dashboard?.mostRentedInstruments?.map(i => i.rentalCount) || [1]), 1);
    const maxGrowth = Math.max(...(dashboard?.rentalGrowth?.map(g => g.newRentals) || [1]), 1);
    const mri = dashboard?.mostRentedInstruments;
    const lr = dashboard?.lateReturns;
    const tc = dashboard?.topCustomers;
    const dt = dashboard?.damageTrend;
    const rg = dashboard?.rentalGrowth;

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>Statistics & Analytics</h2>
                    <p style={s.subtitle}>Overview of business performance</p>
                </div>
                <div style={s.actionRow}>
                    <div style={s.dateGroup}>
                        <label style={s.dateLabel}>From</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={s.dateInput} />
                    </div>
                    <div style={s.dateGroup}>
                        <label style={s.dateLabel}>To</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={s.dateInput} />
                    </div>
                    <button onClick={generatePDF} style={s.exportButton}>📥 Export PDF</button>
                </div>
            </div>
            <div style={s.cardGrid}>
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
                    <div key={card.label} style={s.card(card.color)}>
                        <div style={s.cardLabel}>{card.label}</div>
                        <div style={s.cardValue(card.color)}>{card.value}</div>
                        <div style={s.cardSub}>{card.sub}</div>
                    </div>
                ))}
            </div>
            {monthly.length > 0 && (
                <div style={s.chartCard}>
                    <h3 style={s.chartTitle}>📈 Monthly Revenue (Last 6 Months)</h3>
                    <div style={s.chartWrapper}>
                        {monthly.map((m, idx) => {
                            const total = m.productRentalRevenue + m.studioRentalRevenue;
                            const barH = Math.round((total / maxRevenue) * 160);
                            const prH = Math.round((m.productRentalRevenue / maxRevenue) * 160);
                            const srH = barH - prH;
                            return (
                                <div key={idx} style={s.chartBarContainer}>
                                    <div style={s.chartBarValue}>Rs.{total}</div>
                                    <div style={s.chartBarStack}>
                                        <div style={s.chartBarStudio(srH)} title={`Studio: Rs.${m.studioRentalRevenue}`} />
                                        <div style={s.chartBarProduct(prH)} title={`Products: Rs.${m.productRentalRevenue}`} />
                                    </div>
                                    <div style={s.chartBarLabel}>{m.month}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={s.chartLegend}>
                        <div style={s.legendItem}><div style={s.legendColor('#3b82f6')} /> Product Rentals</div>
                        <div style={s.legendItem}><div style={s.legendColor('#06b6d4')} /> Studio Rentals</div>
                    </div>
                </div>
            )}
            {/* Most Rented Instruments */}
            {mri && mri.length > 0 && (
                <div style={s.section}>
                    <div style={s.sectionTitleRow}>
                        <h3 style={s.sectionTitle}>🎸 Most Rented Instruments</h3>
                        <span style={s.sectionBadge('#dbeafe', '#1d4ed8')}>{mri.length} items</span>
                    </div>
                    <div style={s.tableWrapper}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Instrument</th>
                                    <th style={s.th}>Brand</th>
                                    <th style={s.th}>Serial</th>
                                    <th style={s.thRight}>Times Rented</th>
                                    <th style={s.thRight}>Revenue</th>
                                    <th style={s.th}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mri.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={s.tdNameBold}>{item.itemName || 'N/A'}</td>
                                        <td style={s.td}>{item.brand || '—'}</td>

                                        <td style={s.td}>{item.serialNumber || '—'}</td>
                                        <td style={s.tdRight}>{item.rentalCount}</td>
                                        <td style={s.tdRight}>{currency(item.totalRevenue)}</td>
                                        <td style={s.tdBarCell}>
                                            <div style={s.barTrack}>

                                                <div style={s.barFill((item.rentalCount / maxRented) * 100, '#3b82f6')} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Late Return Statistics */}
            {lr && lr.totalLateReturns > 0 && (
                <div style={s.section}>
                    <div style={s.sectionTitleRow}>
                        <h3 style={s.sectionTitle}>⏰ Late Return Statistics</h3>
                        <span style={s.sectionBadge('#fee2e2', '#991b1b')}>{lr.totalLateReturns} occurrences</span>
                    </div>
                    <div style={s.statsRow}>
                        <div style={s.statBox('#fef2f2', '#fecaca')}>
                            <div style={s.statNumber('#dc2626')}>{lr.totalLateReturns}</div>
                            <div style={s.statLabel}>Total Late Returns</div>
                        </div>
                        <div style={s.statBox('#fefce8', '#fde68a')}>
                            <div style={s.statNumber('#d97706')}>{currency(lr.totalLateFeeCollected)}</div>
                            <div style={s.statLabel}>Late Fees Collected</div>
                        </div>
                        <div style={s.statBox('#eff6ff', '#bfdbfe')}>
                            <div style={s.statNumber('#2563eb')}>{lr.avgLateDays} days</div>
                            <div style={s.statLabel}>Average Late Duration</div>
                        </div>
                    </div>
                    <div style={s.tableWrapper}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Customer</th>
                                    <th style={s.th}>Rental Date</th>
                                    <th style={s.th}>Due Date</th>
                                    <th style={s.th}>Returned</th>
                                    <th style={s.thRight}>Late Days</th>
                                    <th style={s.thRight}>Late Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lr.records.slice(0, 8).map((r, idx) => (
                                    <tr key={idx}>
                                        <td style={s.tdNameBold}>{r.customerName}</td>
                                        <td style={s.td}>{fmtDate(r.rentalDate)}</td>
                                        <td style={s.td}>{fmtDate(r.dueDate)}</td>
                                        <td style={s.td}>{fmtDate(r.returnDate)}</td>
                                        <td style={s.tdLate}>{r.lateDays}d</td>
                                        <td style={s.tdFee}>{currency(r.lateFee)}</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Customers */}
            {tc && tc.length > 0 && (
                <div style={s.section}>
                    <div style={s.sectionTitleRow}>
                        <h3 style={s.sectionTitle}>🏆 Top Customers</h3>
                        <span style={s.sectionBadge('#d1fae5', '#065f46')}>{tc.length} customers</span>
                    </div>
                    <div style={s.tableWrapper}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Customer</th>
                                    <th style={s.th}>Phone</th>
                                    <th style={s.thRight}>Rentals</th>
                                    <th style={s.thRight}>Total Spent</th>
                                    <th style={s.thRight}>Late Fees</th>
                                    <th style={s.thRight}>Damages</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tc.map((c, idx) => (
                                    <tr key={idx}>
                                        <td style={s.tdNameBold}>{c.customerName}</td>
                                        <td style={s.td}>{c.phone}</td>
                                        <td style={s.tdRight}>{c.totalRentals}</td>
                                        <td style={s.tdRight}>{currency(c.totalSpent)}</td>
                                        <td style={s.tdRightColored(c.totalLateFees > 0, '#dc2626')}>{c.totalLateFees > 0 ? currency(c.totalLateFees) : '—'}</td>
                                        <td style={s.tdRightColored(c.totalDamages > 0, '#ea580c')}>{c.totalDamages > 0 ? currency(c.totalDamages) : '—'}</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Maintenance Cost Trends */}
            <div style={s.twoColGrid}>

                <div style={s.section}>
                    <div style={s.sectionTitleRow}>
                        <h3 style={s.sectionTitle}>🔧 Maintenance Cost Trends</h3>
                        {dt && dt.length > 0 && (
                            <span style={s.sectionBadge('#fef3c7', '#92400e')}>
                                Total: {currency(dt.reduce((sum, d) => sum + d.charges, 0))}
                            </span>
                        )}
                    </div>
                    {dt && dt.length > 0 ? (
                        <div style={s.tableWrapper}>
                            <table style={s.table}>
                                <thead>
                                    <tr>
                                        <th style={s.th}>Month</th>
                                        <th style={s.thRight}>Damage Charges</th>
                                        <th style={s.thRight}>Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dt.map((d, idx) => (
                                        <tr key={idx}>
                                            <td style={s.td}>{d.month}</td>
                                            <td style={s.tdDamageRight}>{currency(d.charges)}</td>
                                            <td style={s.tdRight}>{d.count}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={s.emptyState}>✅ No damage costs recorded</div>
                    )}
                </div>

                {/* Rental Growth */}
                <div style={s.section}>
                    <div style={s.sectionTitleRow}>
                        <h3 style={s.sectionTitle}>📊 Rental Growth</h3>
                        {rg && rg.length > 0 && (
                            <span style={s.sectionBadge('#dbeafe', '#1d4ed8')}>
                                Total: {rg.reduce((sum, g) => sum + g.newRentals, 0)} rentals
                            </span>
                        )}
                    </div>
                    {rg && rg.length > 0 ? (
                        <>
                            <div style={s.growthWrapper}>
                                {rg.map((g, idx) => {
                                    const barH = Math.round((g.newRentals / maxGrowth) * 100);
                                    return (
                                        <div key={idx} style={s.growthBarContainer}>
                                            <div style={s.growthValue}>{g.newRentals}</div>
                                            <div style={s.growthBar(barH)} />
                                            <div style={s.growthLabel}>{g.month}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={s.chartLegend}>
                                <div style={s.legendItem}><div style={s.legendColor('#3b82f6')} /> New Rentals per Month</div>
                            </div>
                        </>
                    ) : (
                        <div style={s.emptyState}>No rental growth data available</div>
                    )}
                </div>
            </div>

            {/* Inventory Breakdown */}
            <div style={s.inventoryCard}>
                <h3 style={s.inventoryTitle}>📦 Inventory Availability</h3>
                <div style={s.inventoryGrid}>
                    {[
                        { label: 'Available', value: summary.availableItems, color: '#10b981', bg: '#d1fae5' },
                        { label: 'Rented Out', value: summary.rentedItems, color: '#3b82f6', bg: '#dbeafe' },
                        { label: 'In Maintenance', value: summary.totalInventoryItems - summary.availableItems - summary.rentedItems, color: '#f59e0b', bg: '#fef3c7' },
                    ].map(item => (
                        <div key={item.label} style={s.inventoryItem(item.bg)}>
                            <div style={s.inventoryValue(item.color)}>{item.value}</div>
                            <div style={s.inventoryLabel(item.color)}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsPage;