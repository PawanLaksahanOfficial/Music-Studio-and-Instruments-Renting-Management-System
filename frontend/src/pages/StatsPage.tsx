import { useCallback, useEffect, useReducer, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { statsAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { ErrorState, PageHeader } from '../components/ui';
import { currency, formatDate, toDateInput } from '../utils/format';
import type { DashboardStats, MonthlyStat, StatsSummary } from '../types/api';

interface JsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

const DEFAULT_CHART_COLORS = { c1: '#2f6fed', c2: '#0f8a5f', c3: '#b26a00', grid: '#e2e8f0', text: '#5b6b80' };

const readChartColors = () => {
    if (typeof document === 'undefined') return DEFAULT_CHART_COLORS;
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    return {
        c1: read('--c-chart-1', DEFAULT_CHART_COLORS.c1),
        c2: read('--c-chart-2', DEFAULT_CHART_COLORS.c2),
        c3: read('--c-chart-3', DEFAULT_CHART_COLORS.c3),
        grid: read('--c-border', DEFAULT_CHART_COLORS.grid),
        text: read('--c-text-muted', DEFAULT_CHART_COLORS.text),
    };
};

/**
 * Chart colors come from the same CSS variables the rest of the UI uses.
 * Read once via a lazy initializer rather than an effect — the root element
 * is already in the DOM by first render in this client-only SPA, so there is
 * nothing to defer, and doing so avoids an extra render on mount.
 */
const useChartColors = () => useState(readChartColors)[0];

interface StatsState {
    summary: StatsSummary | null;
    monthly: MonthlyStat[];
    dashboard: DashboardStats | null;
    loading: boolean;
    error: string | null;
}

type StatsAction =
    | { type: 'start' }
    | { type: 'success'; summary: StatsSummary; monthly: MonthlyStat[]; dashboard: DashboardStats }
    | { type: 'error'; message: string };

const statsReducer = (state: StatsState, action: StatsAction): StatsState => {
    switch (action.type) {
        case 'start':
            return { ...state, loading: true, error: null };
        case 'success':
            return {
                summary: action.summary,
                monthly: action.monthly,
                dashboard: action.dashboard,
                loading: false,
                error: null,
            };
        case 'error':
            return { summary: null, monthly: [], dashboard: null, loading: false, error: action.message };
    }
};

const StatsPage = () => {
    const colors = useChartColors();
    const [{ summary, monthly, dashboard, loading, error }, dispatch] = useReducer(statsReducer, {
        summary: null,
        monthly: [],
        dashboard: null,
        loading: true,
        error: null,
    });
    const [range, setRange] = useState({ start: '', end: '' });

    const load = useCallback(() => {
        dispatch({ type: 'start' });
        const params = { start: range.start || undefined, end: range.end || undefined };
        Promise.all([statsAPI.getSummary(params), statsAPI.getMonthly(params), statsAPI.getDashboard(params)])
            .then(([summary, monthly, dashboard]) => dispatch({ type: 'success', summary, monthly, dashboard }))
            .catch(err => dispatch({ type: 'error', message: errorMessage(err) }));
    }, [range.start, range.end]);

    useEffect(load, [load]);

    const exportPDF = () => {
        if (!summary) return;
        try {
            const doc = new jsPDF() as JsPDFWithAutoTable;
            doc.setFontSize(16);
            doc.text('ELVI Music Studio — Statistics Report', 14, 18);
            doc.setFontSize(10);
            doc.text(`Generated ${formatDate(new Date().toISOString())}`, 14, 25);

            autoTable(doc, {
                startY: 32,
                head: [['Metric', 'Value']],
                body: [
                    ['Total revenue', currency(summary.totalRevenue)],
                    ['Active product rentals', String(summary.activeProductRentals)],
                    ['Overdue rentals', String(summary.overdueRentals)],
                    ['Active studio bookings', String(summary.activeStudioRentals)],
                    ['Total customers', String(summary.totalCustomers)],
                    ['Pending payments', currency(summary.pendingPayments)],
                ],
            });

            if (dashboard?.topCustomers.length) {
                autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 10,
                    head: [['Customer', 'Rentals', 'Spent']],
                    body: dashboard.topCustomers.map(c => [c.customerName, String(c.totalRentals), currency(c.totalSpent)]),
                });
            }

            doc.save(`elvi-stats-${toDateInput(new Date())}.pdf`);
        } catch {
            toast.error('Could not generate the PDF');
        }
    };

    if (error) return <ErrorState message={error} onRetry={load} />;

    return (
        <>
            <PageHeader
                title="Statistics"
                subtitle="Revenue, utilisation and customer insight."
                actions={
                    <button type="button" className="btn btn--primary" onClick={exportPDF} disabled={!summary}>
                        ⬇ Export PDF
                    </button>
                }
            />

            <div className="filter-bar">
                <label className="field__label" htmlFor="start" style={{ margin: 0 }}>
                    From
                </label>
                <input
                    id="start"
                    className="input"
                    type="date"
                    style={{ width: 'auto' }}
                    value={range.start}
                    onChange={e => setRange({ ...range, start: e.target.value })}
                />
                <label className="field__label" htmlFor="end" style={{ margin: 0 }}>
                    To
                </label>
                <input
                    id="end"
                    className="input"
                    type="date"
                    style={{ width: 'auto' }}
                    value={range.end}
                    onChange={e => setRange({ ...range, end: e.target.value })}
                />
                {(range.start || range.end) && (
                    <button type="button" className="btn btn--sm" onClick={() => setRange({ start: '', end: '' })}>
                        Clear
                    </button>
                )}
            </div>

            {loading ? (
                <div className="stack">
                    <div className="stat-grid">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 84 }} />
                        ))}
                    </div>
                    <div className="skeleton" style={{ height: 300 }} />
                </div>
            ) : summary ? (
                <div className="stack">
                    <div className="stat-grid">
                        <div className="stat stat--success">
                            <div className="stat__label">Total revenue</div>
                            <div className="stat__value">{currency(summary.totalRevenue)}</div>
                        </div>
                        <div className="stat">
                            <div className="stat__label">Active rentals</div>
                            <div className="stat__value">{summary.activeProductRentals}</div>
                            <div className="stat__hint">{summary.activeStudioRentals} studio bookings</div>
                        </div>
                        <div className={`stat ${summary.overdueRentals > 0 ? 'stat--danger' : 'stat--success'}`}>
                            <div className="stat__label">Overdue</div>
                            <div className="stat__value">{summary.overdueRentals}</div>
                        </div>
                        <div className="stat stat--warning">
                            <div className="stat__label">Pending payments</div>
                            <div className="stat__value">{currency(summary.pendingPayments)}</div>
                            <div className="stat__hint">{summary.pendingInvoices} invoices</div>
                        </div>
                        <div className="stat">
                            <div className="stat__label">Inventory</div>
                            <div className="stat__value">{summary.totalInventoryItems}</div>
                            <div className="stat__hint">
                                {summary.availableItems} available · {summary.rentedItems} out
                            </div>
                        </div>
                        <div className={`stat ${summary.damagedItems > 0 ? 'stat--danger' : 'stat--success'}`}>
                            <div className="stat__label">Damaged items</div>
                            <div className="stat__value">{summary.damagedItems}</div>
                        </div>
                        <div className="stat">
                            <div className="stat__label">Customers</div>
                            <div className="stat__value">{summary.totalCustomers}</div>
                        </div>
                        <div className="stat stat--info">
                            <div className="stat__label">Late returns</div>
                            <div className="stat__value">{dashboard?.lateReturns.totalLateReturns ?? 0}</div>
                            <div className="stat__hint">
                                avg {dashboard?.lateReturns.avgLateDays ?? 0} days ·{' '}
                                {currency(dashboard?.lateReturns.totalLateFeeCollected ?? 0)} collected
                            </div>
                        </div>
                    </div>

                    <div className="chart-grid">
                        <div className="chart-card">
                            <h2 className="chart-card__title">Revenue by month</h2>
                            <p className="chart-card__subtitle">Product rentals vs studio bookings</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={monthly}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                    <XAxis dataKey="month" stroke={colors.text} fontSize={12} tickLine={false} />
                                    <YAxis
                                        stroke={colors.text}
                                        fontSize={12}
                                        tickLine={false}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip formatter={(v) => currency(Number(v))} />
                                    <Legend />
                                    <Bar dataKey="productRentalRevenue" name="Product rentals" fill={colors.c1} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="studioRentalRevenue" name="Studio" fill={colors.c2} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <h2 className="chart-card__title">Rental growth</h2>
                            <p className="chart-card__subtitle">New rentals per month</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={dashboard?.rentalGrowth ?? []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                    <XAxis dataKey="month" stroke={colors.text} fontSize={12} tickLine={false} />
                                    <YAxis stroke={colors.text} fontSize={12} tickLine={false} allowDecimals={false} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="newRentals"
                                        name="New rentals"
                                        stroke={colors.c1}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {(dashboard?.damageTrend.length ?? 0) > 0 && (
                            <div className="chart-card">
                                <h2 className="chart-card__title">Damage charges</h2>
                                <p className="chart-card__subtitle">Collected per month</p>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={dashboard?.damageTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                        <XAxis dataKey="month" stroke={colors.text} fontSize={12} tickLine={false} />
                                        <YAxis stroke={colors.text} fontSize={12} tickLine={false} />
                                        <Tooltip formatter={(v) => currency(Number(v))} />
                                        <Bar dataKey="charges" name="Damage charges" fill={colors.c3} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="chart-grid">
                        <div className="card">
                            <h2 className="card__title">Most rented instruments</h2>
                            {dashboard?.mostRentedInstruments.length ? (
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Item</th>
                                                <th scope="col" className="table__num">
                                                    Rentals
                                                </th>
                                                <th scope="col" className="table__num">
                                                    Revenue
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboard.mostRentedInstruments.map(item => (
                                                <tr key={item.itemId}>
                                                    <td>{item.itemName ?? 'Unknown item'}</td>
                                                    <td className="table__num">{item.rentalCount}</td>
                                                    <td className="table__num">{currency(item.totalRevenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="muted">No rental data in this range.</p>
                            )}
                        </div>

                        <div className="card">
                            <h2 className="card__title">Top customers</h2>
                            {dashboard?.topCustomers.length ? (
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Customer</th>
                                                <th scope="col" className="table__num">
                                                    Rentals
                                                </th>
                                                <th scope="col" className="table__num">
                                                    Spent
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboard.topCustomers.map(c => (
                                                <tr key={c.customerId}>
                                                    <td>{c.customerName}</td>
                                                    <td className="table__num">{c.totalRentals}</td>
                                                    <td className="table__num">{currency(c.totalSpent)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="muted">No customer data in this range.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default StatsPage;
