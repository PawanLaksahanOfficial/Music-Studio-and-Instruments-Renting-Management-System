import { useMemo, useState, type ReactNode } from 'react';
import { format, startOfYear, subDays } from 'date-fns';
import { toast } from 'sonner';
import {
    AlarmClock, Banknote, CalendarCheck, ChartColumnBig, Check, FileDown, Guitar, HandCoins, Hourglass, Table2, Users,
} from 'lucide-react';
import { useMonthlyRevenue, useStatsDashboard, useStatsSummary, type DateRange } from '@/api/stats';
import { getErrorMessage } from '@/lib/api';
import { formatCalendarDate, formatCurrency, todayInput } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { MonthlyRevenue, StatsDashboard, StatsSummary } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, PageHeader, StatCard } from '@/components/data/page';
import { DamageChart, GrowthChart, MostRentedChart, RevenueChart, RevenueLegend } from './charts';

type Preset = '30d' | '90d' | 'ytd' | 'all' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'ytd', label: 'This year' },
    { value: 'all', label: 'All time' },
    { value: 'custom', label: 'Custom' },
];

const day = (d: Date) => format(d, 'yyyy-MM-dd');
const presetRange = (preset: Preset): DateRange => {
    const today = new Date();
    switch (preset) {
        case '30d': return { start: day(subDays(today, 29)), end: day(today) };
        case '90d': return { start: day(subDays(today, 89)), end: day(today) };
        case 'ytd': return { start: day(startOfYear(today)), end: day(today) };
        default: return {};
    }
};

const ChartCard = ({ title, description, actions, children, className }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) => (
    <Card className={cn('min-w-0', className)}>
        <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="min-w-0">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
            {actions}
        </CardHeader>
        <div className="px-3 pb-5 sm:px-5">{children}</div>
    </Card>
);

const SimpleTable = ({ head, rows, align }: { head: string[]; rows: ReactNode[][]; align?: ('left' | 'right')[] }) => (
    <div className="overflow-x-auto px-2">
        <table className="w-full min-w-[520px] text-sm">
            <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    {head.map((h, i) => <th key={h} scope="col" className={cn('px-2 py-2 font-medium', align?.[i] === 'right' ? 'text-right' : 'text-left')}>{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, r) => (
                    <tr key={r} className="border-b last:border-0">
                        {row.map((cell, i) => <td key={i} className={cn('px-2 py-2.5', align?.[i] === 'right' ? 'whitespace-nowrap text-right tabular-nums' : 'text-left')}>{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const revenueTotal = (m: MonthlyRevenue) => m.productRentalRevenue + m.studioRentalRevenue + m.otherRevenue;

const exportPdf = async (summary: StatsSummary, monthly: MonthlyRevenue[], dashboard: StatsDashboard | undefined, rangeLabel: string) => {
    // Loaded on demand so the PDF library stays out of the main bundle.
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new JsPDF();
    const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const brand: [number, number, number] = [79, 70, 229];

    doc.setFontSize(18);
    doc.text('ELVI Music Studio — Business report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${rangeLabel} · generated ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 27);

    autoTable(doc, {
        startY: 34,
        head: [['Metric', 'Value']],
        body: [
            ['Revenue collected', formatCurrency(summary.totalRevenue)],
            ['Outstanding payments', formatCurrency(summary.pendingPayments)],
            ['Paid / pending invoices', `${summary.paidInvoices} / ${summary.pendingInvoices}`],
            ['Rentals out now', String(summary.activeProductRentals)],
            ['Overdue rentals', String(summary.overdueRentals)],
            ['Upcoming studio bookings', String(summary.activeStudioRentals)],
            ['Customers', String(summary.totalCustomers)],
            ['Inventory (available / total)', `${summary.inventory.available} / ${summary.inventory.total}`],
        ],
        headStyles: { fillColor: brand },
    });
    autoTable(doc, {
        startY: lastY() + 10,
        head: [['Month', 'Instrument rentals', 'Studio', 'Other', 'Total']],
        body: monthly.map(m => [m.month, formatCurrency(m.productRentalRevenue), formatCurrency(m.studioRentalRevenue), formatCurrency(m.otherRevenue), formatCurrency(revenueTotal(m))]),
        headStyles: { fillColor: brand },
    });
    if (dashboard?.mostRentedInstruments.length) {
        autoTable(doc, {
            startY: lastY() + 10,
            head: [['Most rented', 'Times rented', 'Revenue']],
            body: dashboard.mostRentedInstruments.slice(0, 10).map(i => [i.itemName ?? 'Removed item', String(i.rentalCount), formatCurrency(i.totalRevenue)]),
            headStyles: { fillColor: brand },
        });
    }
    doc.save(`ELVI_report_${day(new Date())}.pdf`);
};

const StatsPage = () => {
    const [preset, setPreset] = useState<Preset>('90d');
    const [custom, setCustom] = useState<DateRange>({ start: day(subDays(new Date(), 29)), end: todayInput() });
    const debouncedCustom = useDebouncedValue(custom, 400);
    const range = useMemo(() => (preset === 'custom' ? debouncedCustom : presetRange(preset)), [preset, debouncedCustom]);
    const rangeLabel = preset === 'custom'
        ? `${formatCalendarDate(range.start)} – ${formatCalendarDate(range.end)}`
        : PRESETS.find(p => p.value === preset)!.label;

    const summary = useStatsSummary(range);
    const monthly = useMonthlyRevenue(range);
    const dashboard = useStatsDashboard(range);
    const [revenueView, setRevenueView] = useState<'chart' | 'table'>('chart');
    const [exporting, setExporting] = useState(false);

    const error = summary.error ?? monthly.error ?? dashboard.error;
    const refetching = (summary.isFetching || monthly.isFetching || dashboard.isFetching) && !summary.isLoading;
    const s = summary.data;
    const d = dashboard.data;
    const months = monthly.data ?? [];
    const hasRevenue = months.some(m => revenueTotal(m) > 0);

    const download = async () => {
        if (!s) return;
        setExporting(true);
        try {
            await exportPdf(s, months, d, rangeLabel);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not create the PDF'));
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Statistics"
                description="Revenue, rentals and inventory health for the selected period."
                actions={<Button variant="outline" onClick={download} loading={exporting} disabled={!s}><FileDown /> Export PDF</Button>}
            />

            {/* Filters: one row above everything they scope. */}
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div role="radiogroup" aria-label="Date range" className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
                    {PRESETS.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            role="radio"
                            aria-checked={preset === p.value}
                            onClick={() => setPreset(p.value)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                preset === p.value && 'bg-card text-foreground shadow-sm',
                            )}
                        >
                            {preset === p.value && <Check className="size-4" strokeWidth={3} aria-hidden />}
                            {p.label}
                        </button>
                    ))}
                </div>
                {preset === 'custom' && (
                    <div className="flex items-center gap-2">
                        <Input type="date" aria-label="From" value={custom.start ?? ''} max={custom.end} onChange={e => setCustom(c => ({ ...c, start: e.target.value }))} className="w-auto" />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input type="date" aria-label="To" value={custom.end ?? ''} min={custom.start} max={todayInput()} onChange={e => setCustom(c => ({ ...c, end: e.target.value }))} className="w-auto" />
                    </div>
                )}
            </div>

            {error ? (
                <Card><ErrorState error={error} onRetry={() => { void summary.refetch(); void monthly.refetch(); void dashboard.refetch(); }} /></Card>
            ) : (
                // Refetch keeps the frame: previous numbers stay visible, slightly dimmed.
                <div className={cn('space-y-6 transition-opacity', refetching && 'opacity-60')} aria-busy={refetching}>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard label="Revenue" value={formatCurrency(s?.totalRevenue)} icon={Banknote} tone="success" loading={!s} hint={`${s?.paidInvoices ?? 0} paid invoices`} />
                        <StatCard label="Outstanding" value={formatCurrency(s?.pendingPayments)} icon={HandCoins} tone="warning" loading={!s} hint={`${s?.pendingInvoices ?? 0} pending invoices`} />
                        <StatCard label="Out on rent" value={s?.activeProductRentals ?? 0} icon={Guitar} tone="primary" loading={!s} hint={`${s?.overdueRentals ?? 0} overdue`} />
                        <StatCard label="Upcoming sessions" value={s?.activeStudioRentals ?? 0} icon={CalendarCheck} tone="info" loading={!s} hint="Confirmed studio bookings" />
                        <StatCard label="Customers" value={s?.totalCustomers ?? 0} icon={Users} tone="violet" loading={!s} hint="Active records" />
                        <StatCard label="Late returns" value={d?.lateReturns.totalLateReturns ?? 0} icon={AlarmClock} tone="danger" loading={!d} hint={`${formatCurrency(d?.lateReturns.totalLateFeeCollected)} in late fees`} />
                        <StatCard label="Avg. days late" value={d?.lateReturns.avgLateDays ?? 0} icon={Hourglass} tone="warning" loading={!d} hint="For late returns" />
                        <StatCard label="Inventory available" value={`${s?.inventory.available ?? 0} / ${s?.inventory.total ?? 0}`} icon={ChartColumnBig} tone="success" loading={!s} hint="Items ready to rent" />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-3">
                        <ChartCard
                            title="Revenue by month"
                            description="Paid invoices, split by source (tax spread proportionally)."
                            className="xl:col-span-2"
                            actions={
                                <Button variant="ghost" size="sm" onClick={() => setRevenueView(v => (v === 'chart' ? 'table' : 'chart'))} aria-pressed={revenueView === 'table'}>
                                    {revenueView === 'chart' ? <><Table2 /> Table</> : <><ChartColumnBig /> Chart</>}
                                </Button>
                            }
                        >
                            {monthly.isLoading ? <Skeleton className="h-[280px] w-full" /> : !hasRevenue ? (
                                <EmptyState icon={Banknote} title="No paid revenue in this period" description="Paid invoices appear here by month." />
                            ) : revenueView === 'chart' ? (
                                <>
                                    <div className="mb-3 px-2"><RevenueLegend /></div>
                                    <RevenueChart data={months} />
                                </>
                            ) : (
                                <SimpleTable
                                    head={['Month', 'Instruments', 'Studio', 'Other', 'Total']}
                                    align={['left', 'right', 'right', 'right', 'right']}
                                    rows={months.map(m => [m.month, formatCurrency(m.productRentalRevenue), formatCurrency(m.studioRentalRevenue), formatCurrency(m.otherRevenue), <strong key="t">{formatCurrency(revenueTotal(m))}</strong>])}
                                />
                            )}
                        </ChartCard>

                        <ChartCard title="Inventory health" description="Current status of every active item.">
                            {!s ? <Skeleton className="h-48 w-full" /> : (
                                <ul className="space-y-4 px-2">
                                    {([
                                        ['Available', s.inventory.available],
                                        ['Rented out', s.inventory.rented],
                                        ['Maintenance', s.inventory.maintenance],
                                        ['Damaged', s.inventory.damaged],
                                        ['Lost', s.inventory.lost],
                                    ] as const).map(([label, count]) => {
                                        const pct = s.inventory.total ? Math.round((count / s.inventory.total) * 100) : 0;
                                        return (
                                            <li key={label}>
                                                <div className="mb-1.5 flex justify-between text-sm">
                                                    <span>{label}</span>
                                                    <span className="text-muted-foreground"><span className="font-medium tabular-nums text-foreground">{count}</span> · {pct}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--series-1)_14%,transparent)]" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${pct}%`}>
                                                    <div className="h-full rounded-full bg-series-1" style={{ width: `${pct}%` }} />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChartCard title="New rentals per month" description="Rentals created each month.">
                            {!d ? <Skeleton className="h-60 w-full" /> : d.rentalGrowth.length ? <GrowthChart data={d.rentalGrowth} /> : <EmptyState icon={Guitar} title="No rentals in this period" />}
                        </ChartCard>
                        <ChartCard title="Damage charges per month" description="Charged on returns marked damaged.">
                            {!d ? <Skeleton className="h-60 w-full" /> : d.damageTrend.length ? <DamageChart data={d.damageTrend} /> : <EmptyState icon={Check} title="No damage charges" description="Nothing was returned damaged in this period." />}
                        </ChartCard>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ChartCard title="Most rented items" description="Times rented in the period.">
                            {!d ? <Skeleton className="h-60 w-full" /> : d.mostRentedInstruments.length ? <MostRentedChart data={d.mostRentedInstruments} /> : <EmptyState icon={Guitar} title="No rentals in this period" />}
                        </ChartCard>
                        <ChartCard title="Top customers" description="By total spend in the period.">
                            {!d ? <Skeleton className="h-60 w-full" /> : d.topCustomers.length ? (
                                <SimpleTable
                                    head={['Customer', 'Rentals', 'Spent', 'Fees']}
                                    align={['left', 'right', 'right', 'right']}
                                    rows={d.topCustomers.map(c => [
                                        <div key="n"><div className="font-medium">{c.customerName || 'Deleted customer'}</div><div className="text-xs text-muted-foreground">{c.phone}</div></div>,
                                        c.totalRentals,
                                        formatCurrency(c.totalSpent),
                                        c.totalLateFees + c.totalDamages > 0 ? formatCurrency(c.totalLateFees + c.totalDamages) : '—',
                                    ])}
                                />
                            ) : <EmptyState icon={Users} title="No customer activity in this period" />}
                        </ChartCard>
                    </div>

                    {d && d.lateReturns.records.length > 0 && (
                        <ChartCard title="Latest late returns" description="Returns that came back after their due date, longest delays first.">
                            <SimpleTable
                                head={['Rental', 'Customer', 'Due', 'Returned', 'Days late', 'Late fee']}
                                align={['left', 'left', 'left', 'left', 'right', 'right']}
                                rows={d.lateReturns.records.map(r => [
                                    <span key="id" className="font-mono text-xs">{r.rentalId}</span>,
                                    r.customerName || 'Deleted customer',
                                    formatCalendarDate(r.dueDate),
                                    formatCalendarDate(r.returnDate),
                                    r.lateDays,
                                    formatCurrency(r.lateFee),
                                ])}
                            />
                        </ChartCard>
                    )}
                </div>
            )}
        </>
    );
};

export default StatsPage;
