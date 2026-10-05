import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { AlarmClock, Archive, CalendarClock, Guitar, PackageCheck, Pencil, Plus, ScanLine, Trash2, Wallet } from 'lucide-react';
import { useArchiveRental, useDeleteRental, useRentals } from '@/api/rentals';
import { RENTAL_PAYMENT_STATUSES, RENTAL_STATUSES } from '@/lib/constants';
import { dueLabel, formatCalendarDate, formatCurrency, todayInput } from '@/lib/format';
import { cn, fullName } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { Rental } from '@/types/api';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import { EditRentalDialog, NewRentalDialog, ReturnRentalDialog } from './rental-dialogs';

const isActive = (r: Rental) => r.status === 'Rented' || r.status === 'Overdue';

const STATUS_ORDER: Record<Rental['status'], number> = { Overdue: 0, Rented: 1, Returned: 2 };

/** Work queue order: overdue first, then items due soonest, then history (most recent first). */
const byUrgency = (a: Rental, b: Rental) =>
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    || (a.status === 'Returned' ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate));

const itemSummary = (r: Rental) => {
    const names = r.items.map(i => i.itemId?.itemName ?? 'Removed item');
    return names.length > 1 ? `${names[0]} +${names.length - 1} more` : names[0] ?? '—';
};

const DueCell = ({ rental }: { rental: Rental }) => (
    <div>
        <div className="tabular-nums">{formatCalendarDate(rental.dueDate)}</div>
        {isActive(rental) && (
            <div className={cn('text-xs', rental.status === 'Overdue' ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                {dueLabel(rental.dueDate)}
            </div>
        )}
    </div>
);

const column = createColumnHelper<Rental>();

const RentalsPage = () => {
    const { isAdmin } = useAuth();
    const rentals = useRentals();
    const archiveRental = useArchiveRental();
    const deleteRental = useDeleteRental();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState('All');
    const [payment, setPayment] = useState('All');
    const [editing, setEditing] = useState<Rental | null>(null);
    const [returning, setReturning] = useState<Rental | null>(null);
    const archiveConfirm = useConfirm<Rental>();
    const deleteConfirm = useConfirm<Rental>();

    const newOpen = searchParams.get('new') === '1';
    const setNewOpen = (open: boolean) => setSearchParams(open ? { new: '1' } : {}, { replace: true });

    const data = useMemo(
        () => (rentals.data ?? [])
            .filter(r => (status === 'All' || r.status === status) && (payment === 'All' || r.paymentStatus === payment))
            .sort(byUrgency),
        [rentals.data, status, payment],
    );

    const stats = useMemo(() => {
        const all = rentals.data ?? [];
        const today = todayInput();
        return {
            out: all.filter(isActive).length,
            overdue: all.filter(r => r.status === 'Overdue').length,
            dueToday: all.filter(r => isActive(r) && r.dueDate.slice(0, 10) === today).length,
            unpaid: all.filter(r => r.paymentStatus !== 'Paid').reduce((sum, r) => sum + r.totalAmount, 0),
        };
    }, [rentals.data]);

    const actionsFor = (r: Rental): RowAction[] => [
        { label: 'Process return', icon: <PackageCheck />, onSelect: () => setReturning(r), hidden: !isActive(r) },
        { label: 'Edit / extend', icon: <Pencil />, onSelect: () => setEditing(r) },
        { label: 'Archive', icon: <Archive />, onSelect: () => archiveConfirm.open(r), hidden: isActive(r) },
        { label: 'Delete', icon: <Trash2 />, onSelect: () => deleteConfirm.open(r), destructive: true, hidden: !isAdmin },
    ];

    const columns = [
        column.accessor('rentalId', {
            header: 'Rental',
            cell: info => <span className="font-mono text-xs font-medium">{info.getValue()}</span>,
        }),
        column.accessor(r => fullName(r.customer), {
            id: 'customer',
            header: 'Customer',
            cell: info => (
                <div className="min-w-0">
                    <div className="truncate font-medium">{info.getValue()}</div>
                    <div className="truncate text-xs text-muted-foreground">{info.row.original.customer?.phone}</div>
                </div>
            ),
        }),
        column.accessor(itemSummary, { id: 'items', header: 'Items', enableSorting: false, cell: info => <span className="line-clamp-1 max-w-56">{info.getValue()}</span> }),
        column.accessor('dueDate', { header: 'Due', cell: info => <DueCell rental={info.row.original} /> }),
        column.accessor('status', { header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor('totalAmount', { header: 'Total', meta: { align: 'right' }, cell: info => <span className="font-medium tabular-nums">{formatCurrency(info.getValue())}</span> }),
        column.accessor('paymentStatus', { header: 'Payment', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Product Rentals"
                description="Instruments and gear currently out, plus recent rental history."
                actions={
                    <>
                        <Button variant="outline" asChild><Link to="/admin/scanner"><ScanLine /> Scan to rent</Link></Button>
                        <Button onClick={() => setNewOpen(true)}><Plus /> New rental</Button>
                    </>
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Out now" value={stats.out} icon={Guitar} tone="primary" loading={rentals.isLoading} hint="Active rentals" />
                <StatCard label="Overdue" value={stats.overdue} icon={AlarmClock} tone="danger" loading={rentals.isLoading} hint="Past their due date" />
                <StatCard label="Due today" value={stats.dueToday} icon={CalendarClock} tone="warning" loading={rentals.isLoading} hint="Expected back today" />
                <StatCard label="Unpaid" value={formatCurrency(stats.unpaid)} icon={Wallet} tone="violet" loading={rentals.isLoading} hint="Pending or partial" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                getRowId={r => r._id}
                isLoading={rentals.isLoading}
                error={rentals.error}
                onRetry={() => rentals.refetch()}
                searchText={r => `${r.rentalId} ${fullName(r.customer)} ${r.customer?.phone ?? ''} ${r.items.map(i => `${i.itemId?.itemName} ${i.itemId?.serialNumber}`).join(' ')}`}
                searchPlaceholder="Search rental, customer or item"
                rowClassName={r => (r.status === 'Overdue' ? 'bg-red-500/[0.035]' : undefined)}
                toolbar={
                    <>
                        <NativeSelect aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="All">All statuses</option>
                            {RENTAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                        <NativeSelect aria-label="Filter by payment" value={payment} onChange={e => setPayment(e.target.value)}>
                            <option value="All">All payments</option>
                            {RENTAL_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                    </>
                }
                empty={{
                    icon: Guitar,
                    title: 'No rentals yet',
                    description: 'Create a rental here, or scan an instrument to check it out.',
                    action: <Button onClick={() => setNewOpen(true)}><Plus /> New rental</Button>,
                }}
                renderCard={r => (
                    <MobileCard
                        title={fullName(r.customer)}
                        subtitle={<span className="font-mono text-xs">{r.rentalId}</span>}
                        badge={<StatusBadge status={r.status} />}
                        actions={<RowActions actions={actionsFor(r)} />}
                        className={r.status === 'Overdue' ? 'border-red-500/30' : undefined}
                    >
                        <Detail label="Items" className="col-span-2">{itemSummary(r)}</Detail>
                        <Detail label="Due"><DueCell rental={r} /></Detail>
                        <Detail label="Total"><span className="flex flex-wrap items-center gap-1.5">{formatCurrency(r.totalAmount)} <StatusBadge status={r.paymentStatus} /></span></Detail>
                        {isActive(r) && (
                            <div className="col-span-2 mt-1">
                                <Button variant="soft" size="sm" className="w-full" onClick={() => setReturning(r)}><PackageCheck /> Process return</Button>
                            </div>
                        )}
                    </MobileCard>
                )}
            />

            <NewRentalDialog open={newOpen} onOpenChange={setNewOpen} />
            <EditRentalDialog rental={editing} onOpenChange={open => !open && setEditing(null)} />
            <ReturnRentalDialog rental={returning} onOpenChange={open => !open && setReturning(null)} />
            <ConfirmDialog
                {...archiveConfirm.dialogProps}
                title={`Archive ${archiveConfirm.target?.rentalId}?`}
                description="The rental moves to the archive. You can restore it later."
                confirmLabel="Archive"
                successMessage="Rental archived"
                onConfirm={() => archiveRental.mutateAsync(archiveConfirm.target!._id)}
            />
            <ConfirmDialog
                {...deleteConfirm.dialogProps}
                tone="destructive"
                title={`Delete ${deleteConfirm.target?.rentalId}?`}
                description="This permanently removes the rental. Items still out are returned to stock. Invoiced rentals can't be deleted."
                confirmLabel="Delete permanently"
                successMessage="Rental deleted"
                onConfirm={() => deleteRental.mutateAsync(deleteConfirm.target!._id)}
            />
        </>
    );
};

export default RentalsPage;
