import type { ReactNode } from 'react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { MonthlyRevenue, StatsDashboard } from '@/types/api';

/*
 * Chart conventions (dataviz method): series colours are the validated --series-* slots in a
 * fixed order; bars are at most 24px with 4px rounded data ends; lines are 2px; touching marks
 * are separated by a 2px surface-coloured gap; text always uses text tokens, never series colours.
 */

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const axisTick = { fill: 'var(--muted-foreground)', fontSize: 12 };
const SURFACE = 'var(--card)';

/** Round axis ticks: a 1 / 2 / 2.5 / 5 x 10^n step giving about four intervals. */
const niceTicks = (max: number, intervals = 4) => {
    if (!(max > 0)) return [0, 1];
    const raw = max / intervals;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? raw;
    const top = Math.ceil(max / step) * step;
    return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Number((i * step).toFixed(6)));
};

const yScale = (max: number, integer = false) => {
    const ticks = niceTicks(integer ? Math.max(1, Math.ceil(max)) : max).filter(t => !integer || Number.isInteger(t));
    return { ticks, domain: [0, ticks[ticks.length - 1]] as [number, number] };
};

interface TooltipRow {
    name?: string | number;
    value?: number | string | readonly (number | string)[];
    color?: string;
    dataKey?: string | number | ((obj: unknown) => unknown);
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: readonly TooltipRow[];
    label?: ReactNode;
    format?: (value: number) => string;
    total?: boolean;
}

/** Value first (strong), series name second, keyed with a short line in the series colour. */
const ChartTooltip = ({ active, payload, label, format = formatCurrency, total }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    const rows = payload.filter(row => typeof row.value === 'number');
    const sum = rows.reduce((s, row) => s + (row.value as number), 0);
    return (
        <div className="min-w-40 rounded-xl border bg-popover px-3 py-2.5 text-sm text-popover-foreground shadow-lg">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
            <ul className="space-y-1">
                {[...rows].reverse().map(row => (
                    <li key={String(row.dataKey)} className="flex items-center gap-2">
                        <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden />
                        <span className="font-semibold tabular-nums">{format(row.value as number)}</span>
                        <span className="text-muted-foreground">{row.name}</span>
                    </li>
                ))}
            </ul>
            {total && rows.length > 1 && (
                <p className="mt-1.5 border-t pt-1.5"><span className="font-semibold tabular-nums">{format(sum)}</span> <span className="text-muted-foreground">total</span></p>
            )}
        </div>
    );
};

/** Legend mirrors the mark shape: a rounded rect for bars. Text stays in text colours. */
const Legend = ({ items }: { items: { label: string; color: string }[] }) => (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Legend">
        {items.map(item => (
            <li key={item.label} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
                {item.label}
            </li>
        ))}
    </ul>
);

const REVENUE_SERIES = [
    { key: 'productRentalRevenue', label: 'Instrument rentals', color: 'var(--series-1)' },
    { key: 'studioRentalRevenue', label: 'Studio bookings', color: 'var(--series-2)' },
    { key: 'otherRevenue', label: 'Other', color: 'var(--series-3)' },
] as const;

export const RevenueLegend = () => <Legend items={REVENUE_SERIES.map(s => ({ label: s.label, color: s.color }))} />;

/** Stacked monthly revenue by source. */
export const RevenueChart = ({ data }: { data: MonthlyRevenue[] }) => {
    const y = yScale(Math.max(...data.map(m => m.productRentalRevenue + m.studioRentalRevenue + m.otherRevenue), 0));
    return (
    <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: 'var(--input)' }} tick={axisTick} tickMargin={8} />
            <YAxis ticks={y.ticks} domain={y.domain} tickFormatter={v => compact.format(v)} tickLine={false} axisLine={false} tick={axisTick} width={44} />
            <Tooltip cursor={{ fill: 'var(--accent)', opacity: 0.6 }} content={props => <ChartTooltip {...props} total />} />
            {REVENUE_SERIES.map((series, index) => (
                <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stackId="revenue"
                    fill={series.color}
                    stroke={SURFACE}
                    strokeWidth={2}
                    maxBarSize={24}
                    radius={index === REVENUE_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive={false}
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
    );
};

/** New rentals per month: one series, so no legend — the card title names it. */
export const GrowthChart = ({ data }: { data: StatsDashboard['rentalGrowth'] }) => {
    const y = yScale(Math.max(...data.map(g => g.newRentals), 0), true);
    return (
    <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: 'var(--input)' }} tick={axisTick} tickMargin={8} />
            <YAxis ticks={y.ticks} domain={y.domain} allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} width={32} />
            <Tooltip
                cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                content={props => <ChartTooltip {...props} format={v => `${formatNumber(v)} rentals`} />}
            />
            <Area
                type="monotone"
                dataKey="newRentals"
                name="New rentals"
                stroke="var(--series-1)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="var(--series-1)"
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 5, fill: 'var(--series-1)', stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
            />
        </AreaChart>
    </ResponsiveContainer>
    );
};

/** Damage charges per month (single series columns). */
export const DamageChart = ({ data }: { data: StatsDashboard['damageTrend'] }) => {
    const y = yScale(Math.max(...data.map(d => d.charges), 0));
    return (
    <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: 'var(--input)' }} tick={axisTick} tickMargin={8} />
            <YAxis ticks={y.ticks} domain={y.domain} tickFormatter={v => compact.format(v)} tickLine={false} axisLine={false} tick={axisTick} width={44} />
            <Tooltip cursor={{ fill: 'var(--accent)', opacity: 0.6 }} content={props => <ChartTooltip {...props} />} />
            <Bar dataKey="charges" name="Damage charges" fill="var(--series-1)" stroke={SURFACE} strokeWidth={2} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
    </ResponsiveContainer>
    );
};

/** Top rented items as horizontal bars, with the count at each bar's tip. */
export const MostRentedChart = ({ data }: { data: StatsDashboard['mostRentedInstruments'] }) => {
    const rows = data.slice(0, 8).map(d => ({ name: d.itemName ?? 'Removed item', count: d.rentalCount, revenue: d.totalRevenue }));
    return (
        <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40)}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={{ stroke: 'var(--input)' }} tick={axisTick} width={132} />
                <Tooltip cursor={{ fill: 'var(--accent)', opacity: 0.6 }} content={props => <ChartTooltip {...props} format={v => `${formatNumber(v)} rentals`} />} />
                <Bar dataKey="count" name="Times rented" fill="var(--series-1)" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    <LabelList dataKey="count" position="right" fill="var(--foreground)" fontSize={12} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
