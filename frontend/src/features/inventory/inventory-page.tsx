import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Archive, Boxes, CircleCheck, Guitar, Pencil, Plus, QrCode, ScanLine, Trash2, TriangleAlert } from 'lucide-react';
import { useArchiveInventoryItem, useDeleteInventoryItem, useInventory } from '@/api/inventory';
import { INVENTORY_CATEGORIES, INVENTORY_STATUSES } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import type { InventoryItem } from '@/types/api';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import { ItemDialog, QrDialog } from './inventory-dialogs';

const makeModel = (i: InventoryItem) => [i.brand, i.itemModel].filter(Boolean).join(' · ');

const column = createColumnHelper<InventoryItem>();

const InventoryPage = () => {
    const navigate = useNavigate();
    const inventory = useInventory();
    const archiveItem = useArchiveInventoryItem();
    const deleteItem = useDeleteInventoryItem();
    const [searchParams, setSearchParams] = useSearchParams();
    const [editing, setEditing] = useState<InventoryItem | null>(null);
    const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
    const [status, setStatus] = useState('All');
    const [category, setCategory] = useState('All');
    const archiveConfirm = useConfirm<InventoryItem>();
    const deleteConfirm = useConfirm<InventoryItem>();

    const isNew = searchParams.get('new') === '1';
    const dialogOpen = isNew || editing !== null;
    const closeDialog = () => { setEditing(null); if (isNew) setSearchParams({}, { replace: true }); };

    const data = useMemo(
        () => (inventory.data ?? []).filter(i => (status === 'All' || i.status === status) && (category === 'All' || i.category === category)),
        [inventory.data, status, category],
    );

    const stats = useMemo(() => {
        const all = inventory.data ?? [];
        return {
            total: all.length,
            available: all.filter(i => i.status === 'Available').length,
            rented: all.filter(i => i.status === 'Rented').length,
            attention: all.filter(i => ['Maintenance', 'Damaged', 'Lost'].includes(i.status)).length,
        };
    }, [inventory.data]);

    const rentNow = (i: InventoryItem) => navigate('/admin/scanner', { state: { prefillQR: i.qrCodeId } });

    const actionsFor = (i: InventoryItem): RowAction[] => [
        { label: 'Show QR label', icon: <QrCode />, onSelect: () => setQrItem(i) },
        { label: 'Rent this item', icon: <ScanLine />, onSelect: () => rentNow(i), hidden: i.status !== 'Available' },
        { label: 'Edit', icon: <Pencil />, onSelect: () => setEditing(i) },
        { label: 'Archive', icon: <Archive />, onSelect: () => archiveConfirm.open(i), hidden: i.status === 'Rented' },
        { label: 'Delete', icon: <Trash2 />, onSelect: () => deleteConfirm.open(i), destructive: true, hidden: i.status === 'Rented' },
    ];

    const columns = [
        column.accessor('itemName', {
            header: 'Item',
            cell: info => (
                <div className="min-w-0">
                    <div className="truncate font-medium">{info.getValue()}</div>
                    <div className="truncate text-xs text-muted-foreground">{makeModel(info.row.original) || '—'}</div>
                </div>
            ),
        }),
        column.accessor('category', { header: 'Category' }),
        column.accessor('serialNumber', { header: 'Serial', cell: info => <span className="font-mono text-xs">{info.getValue()}</span> }),
        column.accessor('status', { header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor('baseRentalPrice', { header: 'Rate / day', meta: { align: 'right' }, cell: info => <span className="font-medium tabular-nums">{formatCurrency(info.getValue())}</span> }),
        column.display({
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            meta: { align: 'right' },
            cell: info => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setQrItem(info.row.original)} aria-label={`QR label for ${info.row.original.itemName}`}><QrCode /></Button>
                    <RowActions actions={actionsFor(info.row.original)} />
                </div>
            ),
        }),
    ];

    return (
        <>
            <PageHeader
                title="Inventory"
                description="Instruments and gear available for rent, each with its own QR label."
                actions={<Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><Plus /> Add item</Button>}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Items" value={stats.total} icon={Boxes} tone="primary" loading={inventory.isLoading} hint="In the catalog" />
                <StatCard label="Available" value={stats.available} icon={CircleCheck} tone="success" loading={inventory.isLoading} hint="Ready to rent" />
                <StatCard label="Rented out" value={stats.rented} icon={Guitar} tone="info" loading={inventory.isLoading} hint="With customers" />
                <StatCard label="Needs attention" value={stats.attention} icon={TriangleAlert} tone="warning" loading={inventory.isLoading} hint="Maintenance, damaged or lost" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                getRowId={i => i._id}
                isLoading={inventory.isLoading}
                error={inventory.error}
                onRetry={() => inventory.refetch()}
                searchText={i => `${i.itemName} ${i.serialNumber} ${i.brand ?? ''} ${i.itemModel ?? ''} ${i.qrCodeId}`}
                searchPlaceholder="Search name, serial, brand or QR code"
                initialSorting={[{ id: 'itemName', desc: false }]}
                toolbar={
                    <>
                        <NativeSelect aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="All">All statuses</option>
                            {INVENTORY_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                        <NativeSelect aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="All">All categories</option>
                            {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </NativeSelect>
                    </>
                }
                empty={{
                    icon: Boxes,
                    title: 'No inventory yet',
                    description: 'Add your first instrument to start renting it out.',
                    action: <Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><Plus /> Add item</Button>,
                }}
                renderCard={i => (
                    <MobileCard
                        title={i.itemName}
                        subtitle={makeModel(i) || i.category}
                        badge={<StatusBadge status={i.status} />}
                        actions={<RowActions actions={actionsFor(i)} />}
                    >
                        <Detail label="Serial"><span className="font-mono text-xs">{i.serialNumber}</span></Detail>
                        <Detail label="Rate / day">{formatCurrency(i.baseRentalPrice)}</Detail>
                        <div className="col-span-2 mt-1 grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setQrItem(i)}><QrCode /> QR label</Button>
                            {i.status === 'Available' && <Button variant="soft" size="sm" onClick={() => rentNow(i)}><ScanLine /> Rent</Button>}
                        </div>
                    </MobileCard>
                )}
            />

            <ItemDialog open={dialogOpen} item={editing} onOpenChange={open => !open && closeDialog()} />
            <QrDialog item={qrItem} onOpenChange={open => !open && setQrItem(null)} />
            <ConfirmDialog
                {...archiveConfirm.dialogProps}
                title={`Archive ${archiveConfirm.target?.itemName}?`}
                description="Archived items can't be rented. You can restore them from the archive."
                confirmLabel="Archive"
                successMessage="Item archived"
                onConfirm={() => archiveItem.mutateAsync(archiveConfirm.target!._id)}
            />
            <ConfirmDialog
                {...deleteConfirm.dialogProps}
                tone="destructive"
                title={`Delete ${deleteConfirm.target?.itemName}?`}
                description="This permanently removes the item. Items with rental history can't be deleted — archive them instead."
                confirmLabel="Delete permanently"
                successMessage="Item deleted"
                onConfirm={() => deleteItem.mutateAsync(deleteConfirm.target!._id)}
            />
        </>
    );
};

export default InventoryPage;
