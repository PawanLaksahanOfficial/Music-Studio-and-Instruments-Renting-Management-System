import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { ArchiveRestore, Boxes, Guitar, MicVocal, Trash2, Users } from 'lucide-react';
import { useArchivedRentals, useDeleteRental, useRestoreRental } from '@/api/rentals';
import { useArchivedStudioBookings, useDeleteStudioBooking, useRestoreStudioBooking } from '@/api/studio';
import { useArchivedCustomers, useDeleteCustomer, useRestoreCustomer } from '@/api/customers';
import { useArchivedInventory, useDeleteInventoryItem, useRestoreInventoryItem } from '@/api/inventory';
import { getErrorMessage } from '@/lib/api';
import { formatCalendarDate, formatCurrency, formatDate } from '@/lib/format';
import { fullName } from '@/lib/utils';
import type { Customer, InventoryItem, Rental, StudioBooking } from '@/types/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/menus';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';

const TABS = ['rentals', 'studio', 'customers', 'inventory'] as const;
type Tab = (typeof TABS)[number];

/** Restore + (confirmed) permanent delete, shared by every archive tab. */
const useArchiveActions = <T extends { _id: string }>(
    restore: (id: string) => Promise<unknown>,
    remove: (id: string) => Promise<unknown>,
    label: (row: T) => string,
) => {
    const deleteConfirm = useConfirm<T>();
    const actionsFor = (row: T): RowAction[] => [
        {
            label: 'Restore',
            icon: <ArchiveRestore />,
            onSelect: async () => {
                try {
                    await restore(row._id);
                    toast.success(`${label(row)} restored`);
                } catch (err) {
                    toast.error(getErrorMessage(err));
                }
            },
        },
        { label: 'Delete permanently', icon: <Trash2 />, destructive: true, onSelect: () => deleteConfirm.open(row) },
    ];
    const dialog = (
        <ConfirmDialog
            {...deleteConfirm.dialogProps}
            tone="destructive"
            title={`Permanently delete ${deleteConfirm.target ? label(deleteConfirm.target) : ''}?`}
            description="This cannot be undone. Records referenced by invoices or rentals are protected and can't be deleted."
            confirmLabel="Delete permanently"
            successMessage="Deleted permanently"
            onConfirm={() => remove(deleteConfirm.target!._id)}
        />
    );
    return { actionsFor, dialog };
};

const rentalCol = createColumnHelper<Rental>();
const RentalsTab = () => {
    const rentals = useArchivedRentals();
    const restore = useRestoreRental();
    const remove = useDeleteRental();
    const { actionsFor, dialog } = useArchiveActions<Rental>(restore.mutateAsync, remove.mutateAsync, r => r.rentalId);
    const columns = [
        rentalCol.accessor('rentalId', { header: 'Rental', cell: i => <span className="font-mono text-xs">{i.getValue()}</span> }),
        rentalCol.accessor(r => fullName(r.customer), { id: 'customer', header: 'Customer' }),
        rentalCol.accessor(r => r.items.map(i => i.itemId?.itemName).filter(Boolean).join(', '), { id: 'items', header: 'Items', enableSorting: false, cell: i => <span className="line-clamp-1 max-w-56">{i.getValue() || '—'}</span> }),
        rentalCol.accessor('returnDate', { header: 'Returned', cell: i => formatCalendarDate(i.getValue()) }),
        rentalCol.accessor('totalAmount', { header: 'Total', meta: { align: 'right' }, cell: i => formatCurrency(i.getValue()) }),
        rentalCol.accessor('archivedAt', { header: 'Archived', cell: i => formatDate(i.getValue()) }),
        rentalCol.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: i => <RowActions actions={actionsFor(i.row.original)} /> }),
    ];
    return (
        <>
            <DataTable
                data={rentals.data} columns={columns} getRowId={r => r._id} isLoading={rentals.isLoading} error={rentals.error} onRetry={() => rentals.refetch()}
                searchText={r => `${r.rentalId} ${fullName(r.customer)}`} searchPlaceholder="Search archived rentals"
                empty={{ icon: Guitar, title: 'No archived rentals', description: 'Returned rentals you archive appear here.' }}
                renderCard={r => (
                    <MobileCard title={fullName(r.customer)} subtitle={<span className="font-mono text-xs">{r.rentalId}</span>} badge={<StatusBadge status={r.status} />} actions={<RowActions actions={actionsFor(r)} />}>
                        <Detail label="Total">{formatCurrency(r.totalAmount)}</Detail>
                        <Detail label="Archived">{formatDate(r.archivedAt)}</Detail>
                    </MobileCard>
                )}
            />
            {dialog}
        </>
    );
};

const studioCol = createColumnHelper<StudioBooking>();
const StudioTab = () => {
    const bookings = useArchivedStudioBookings();
    const restore = useRestoreStudioBooking();
    const remove = useDeleteStudioBooking();
    const { actionsFor, dialog } = useArchiveActions<StudioBooking>(restore.mutateAsync, remove.mutateAsync, b => b.bookingId);
    const columns = [
        studioCol.accessor('bookingId', { header: 'Booking', cell: i => <span className="font-mono text-xs">{i.getValue()}</span> }),
        studioCol.accessor(b => fullName(b.customer), { id: 'customer', header: 'Customer' }),
        studioCol.accessor('roomName', { header: 'Room' }),
        studioCol.accessor('startTime', { header: 'Date', cell: i => formatDate(i.getValue()) }),
        studioCol.accessor('status', { header: 'Status', cell: i => <StatusBadge status={i.getValue()} /> }),
        studioCol.accessor('archivedAt', { header: 'Archived', cell: i => formatDate(i.getValue()) }),
        studioCol.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: i => <RowActions actions={actionsFor(i.row.original)} /> }),
    ];
    return (
        <>
            <DataTable
                data={bookings.data} columns={columns} getRowId={b => b._id} isLoading={bookings.isLoading} error={bookings.error} onRetry={() => bookings.refetch()}
                searchText={b => `${b.bookingId} ${fullName(b.customer)} ${b.roomName}`} searchPlaceholder="Search archived bookings"
                empty={{ icon: MicVocal, title: 'No archived bookings' }}
                renderCard={b => (
                    <MobileCard title={fullName(b.customer)} subtitle={`${b.roomName} · ${b.bookingId}`} badge={<StatusBadge status={b.status} />} actions={<RowActions actions={actionsFor(b)} />}>
                        <Detail label="Date">{formatDate(b.startTime)}</Detail>
                        <Detail label="Archived">{formatDate(b.archivedAt)}</Detail>
                    </MobileCard>
                )}
            />
            {dialog}
        </>
    );
};

const customerCol = createColumnHelper<Customer>();
const CustomersTab = () => {
    const customers = useArchivedCustomers();
    const restore = useRestoreCustomer();
    const remove = useDeleteCustomer();
    const { actionsFor, dialog } = useArchiveActions<Customer>(restore.mutateAsync, remove.mutateAsync, c => fullName(c));
    const columns = [
        customerCol.accessor(c => fullName(c), { id: 'name', header: 'Customer', cell: i => <span className="font-medium">{i.getValue()}</span> }),
        customerCol.accessor('phone', { header: 'Phone' }),
        customerCol.accessor('nicOrPassport', { header: 'NIC / passport', cell: i => <span className="font-mono text-xs">{i.getValue()}</span> }),
        customerCol.accessor('archivedAt', { header: 'Archived', cell: i => formatDate(i.getValue()) }),
        customerCol.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: i => <RowActions actions={actionsFor(i.row.original)} /> }),
    ];
    return (
        <>
            <DataTable
                data={customers.data} columns={columns} getRowId={c => c._id} isLoading={customers.isLoading} error={customers.error} onRetry={() => customers.refetch()}
                searchText={c => `${fullName(c)} ${c.phone} ${c.nicOrPassport}`} searchPlaceholder="Search archived customers"
                empty={{ icon: Users, title: 'No archived customers' }}
                renderCard={c => (
                    <MobileCard title={fullName(c)} subtitle={c.phone} actions={<RowActions actions={actionsFor(c)} />}>
                        <Detail label="NIC / passport">{c.nicOrPassport}</Detail>
                        <Detail label="Archived">{formatDate(c.archivedAt)}</Detail>
                    </MobileCard>
                )}
            />
            {dialog}
        </>
    );
};

const itemCol = createColumnHelper<InventoryItem>();
const InventoryTab = () => {
    const items = useArchivedInventory();
    const restore = useRestoreInventoryItem();
    const remove = useDeleteInventoryItem();
    const { actionsFor, dialog } = useArchiveActions<InventoryItem>(restore.mutateAsync, remove.mutateAsync, i => i.itemName);
    const columns = [
        itemCol.accessor('itemName', { header: 'Item', cell: i => <span className="font-medium">{i.getValue()}</span> }),
        itemCol.accessor('serialNumber', { header: 'Serial', cell: i => <span className="font-mono text-xs">{i.getValue()}</span> }),
        itemCol.accessor('category', { header: 'Category' }),
        itemCol.accessor('status', { header: 'Status', cell: i => <StatusBadge status={i.getValue()} /> }),
        itemCol.accessor('archivedAt', { header: 'Archived', cell: i => formatDate(i.getValue()) }),
        itemCol.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: i => <RowActions actions={actionsFor(i.row.original)} /> }),
    ];
    return (
        <>
            <DataTable
                data={items.data} columns={columns} getRowId={i => i._id} isLoading={items.isLoading} error={items.error} onRetry={() => items.refetch()}
                searchText={i => `${i.itemName} ${i.serialNumber} ${i.brand ?? ''}`} searchPlaceholder="Search archived items"
                empty={{ icon: Boxes, title: 'No archived items' }}
                renderCard={i => (
                    <MobileCard title={i.itemName} subtitle={<span className="font-mono text-xs">{i.serialNumber}</span>} badge={<StatusBadge status={i.status} />} actions={<RowActions actions={actionsFor(i)} />}>
                        <Detail label="Category">{i.category}</Detail>
                        <Detail label="Archived">{formatDate(i.archivedAt)}</Detail>
                    </MobileCard>
                )}
            />
            {dialog}
        </>
    );
};

const ArchivePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const requested = searchParams.get('tab') as Tab | null;
    const tab: Tab = requested && TABS.includes(requested) ? requested : 'rentals';

    return (
        <>
            <PageHeader title="Archive" description="Archived records are hidden from everyday lists. Restore them here, or delete them for good." />
            <Tabs value={tab} onValueChange={value => setSearchParams({ tab: value }, { replace: true })}>
                <TabsList className="mb-5">
                    <TabsTrigger value="rentals"><Guitar /> Rentals</TabsTrigger>
                    <TabsTrigger value="studio"><MicVocal /> Studio</TabsTrigger>
                    <TabsTrigger value="customers"><Users /> Customers</TabsTrigger>
                    <TabsTrigger value="inventory"><Boxes /> Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="rentals"><RentalsTab /></TabsContent>
                <TabsContent value="studio"><StudioTab /></TabsContent>
                <TabsContent value="customers"><CustomersTab /></TabsContent>
                <TabsContent value="inventory"><InventoryTab /></TabsContent>
            </Tabs>
        </>
    );
};

export default ArchivePage;
