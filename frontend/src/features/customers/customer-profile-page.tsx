import { Link, useParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowLeft, CalendarClock, Guitar, History, IdCard, Mail, MapPin, Phone, ReceiptText, Wallet } from 'lucide-react';
import { useCustomerProfile } from '@/api/customers';
import { formatCalendarDate, formatCurrency, formatDate } from '@/lib/format';
import { fullName, initials } from '@/lib/utils';
import type { CustomerProfile } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, ErrorState, PageHeader, PageLoader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';

type HistoryRow = CustomerProfile['rentalHistory'][number];
const column = createColumnHelper<HistoryRow>();

const itemNames = (r: HistoryRow) => r.items.map(i => i.itemId?.itemName).filter(Boolean).join(', ') || '—';

const columns = [
    column.accessor('rentalId', { header: 'Rental', cell: info => <span className="font-mono text-xs font-medium">{info.getValue()}</span> }),
    column.accessor(itemNames, { id: 'items', header: 'Items', enableSorting: false, cell: info => <span className="line-clamp-1 max-w-56">{info.getValue()}</span> }),
    column.accessor('rentalDate', { header: 'Rented', cell: info => formatCalendarDate(info.getValue()) }),
    column.accessor('dueDate', { header: 'Due', cell: info => formatCalendarDate(info.getValue()) }),
    column.accessor('returnDate', { header: 'Returned', cell: info => formatCalendarDate(info.getValue()) }),
    column.accessor('status', { header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
    column.accessor('totalAmount', { header: 'Total', meta: { align: 'right' }, cell: info => <span className="font-medium tabular-nums">{formatCurrency(info.getValue())}</span> }),
    column.accessor('paymentStatus', { header: 'Payment', cell: info => <StatusBadge status={info.getValue()} /> }),
    column.accessor(r => r.lateFee + r.damageCharges, {
        id: 'fees',
        header: 'Fees',
        meta: { align: 'right' },
        cell: info => (info.getValue() > 0 ? <span className="tabular-nums text-red-600 dark:text-red-400">{formatCurrency(info.getValue())}</span> : <span className="text-muted-foreground">—</span>),
    }),
];

const ContactRow = ({ icon: Icon, children }: { icon: typeof Phone; children: React.ReactNode }) => (
    <li className="flex min-w-0 items-center gap-2.5 text-sm"><Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{children}</span></li>
);

const CustomerProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const profile = useCustomerProfile(id);
    const back = <Button variant="ghost" size="sm" className="-ml-2" asChild><Link to="/admin/customers"><ArrowLeft /> Customers</Link></Button>;

    if (profile.isLoading) return <PageLoader />;
    if (profile.error || !profile.data) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;

    const { customer, stats, rentalHistory } = profile.data;
    const name = fullName(customer);

    return (
        <>
            <PageHeader title={name} eyebrow={back} description={`Customer since ${formatDate(customer.createdAt)}`} />

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <Card className="h-fit p-6">
                    <div className="flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-semibold text-white">{initials(name)}</span>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold">{name}</p>
                            <StatusBadge status={customer.isBlacklisted ? 'Blacklisted' : 'Active'} className="mt-1" />
                        </div>
                    </div>
                    <ul className="mt-6 space-y-3 border-t pt-5">
                        <ContactRow icon={Phone}><a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a></ContactRow>
                        <ContactRow icon={Mail}>{customer.email ? <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a> : 'No email'}</ContactRow>
                        <ContactRow icon={IdCard}><span className="font-mono">{customer.nicOrPassport}</span></ContactRow>
                        {customer.address && <ContactRow icon={MapPin}>{customer.address}</ContactRow>}
                    </ul>
                </Card>

                <div className="min-w-0 space-y-6">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard label="Rentals" value={stats.totalRentals} icon={History} tone="primary" hint="All time" />
                        <StatCard label="Out now" value={stats.activeRentals} icon={Guitar} tone="info" hint="Active rentals" />
                        <StatCard label="Total spend" value={formatCurrency(stats.totalSpending)} icon={Wallet} tone="success" hint={stats.lastRentalDate ? `Last rental ${formatDate(stats.lastRentalDate)}` : 'No rentals yet'} />
                        <StatCard label="Unpaid fees" value={formatCurrency(stats.outstandingFines)} icon={stats.outstandingFines > 0 ? CalendarClock : ReceiptText} tone={stats.outstandingFines > 0 ? 'danger' : 'success'} hint="Late & damage fees" />
                    </div>

                    <section aria-labelledby="history-heading">
                        <h2 id="history-heading" className="mb-3 text-base font-semibold">Rental history</h2>
                        <DataTable
                            data={rentalHistory}
                            columns={columns}
                            getRowId={r => r._id}
                            searchText={r => `${r.rentalId} ${itemNames(r)}`}
                            searchPlaceholder="Search rentals"
                            empty={{ icon: Guitar, title: 'No rentals yet', description: `${name} hasn't rented anything so far.` }}
                            renderCard={r => (
                                <MobileCard title={itemNames(r)} subtitle={<span className="font-mono text-xs">{r.rentalId}</span>} badge={<StatusBadge status={r.status} />}>
                                    <Detail label="Rented">{formatCalendarDate(r.rentalDate)}</Detail>
                                    <Detail label="Due">{formatCalendarDate(r.dueDate)}</Detail>
                                    <Detail label="Total">{formatCurrency(r.totalAmount)}</Detail>
                                    <Detail label="Payment"><StatusBadge status={r.paymentStatus} /></Detail>
                                </MobileCard>
                            )}
                        />
                    </section>
                </div>
            </div>
        </>
    );
};

export default CustomerProfilePage;
