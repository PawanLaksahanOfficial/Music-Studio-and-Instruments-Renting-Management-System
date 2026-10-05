import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowLeft, CircleCheck, Hammer, PartyPopper, Wrench } from 'lucide-react';
import { useDamagedInventory, useUpdateInventoryItem } from '@/api/inventory';
import { formatCurrency, formatRelative } from '@/lib/format';
import type { InventoryItem } from '@/types/api';
import { Button } from '@/components/ui/button';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';

const column = createColumnHelper<InventoryItem>();

const DamagedPage = () => {
    const damaged = useDamagedInventory();
    const update = useUpdateInventoryItem();
    const repaired = useConfirm<InventoryItem>();
    const toMaintenance = useConfirm<InventoryItem>();

    const byCategory = useMemo(() => {
        const counts = new Map<string, number>();
        (damaged.data ?? []).forEach(i => counts.set(i.category, (counts.get(i.category) ?? 0) + 1));
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [damaged.data]);

    const actionsFor = (i: InventoryItem): RowAction[] => [
        { label: 'Repaired — mark available', icon: <CircleCheck />, onSelect: () => repaired.open(i) },
        { label: 'Send to maintenance', icon: <Hammer />, onSelect: () => toMaintenance.open(i) },
    ];

    const columns = [
        column.accessor('itemName', {
            header: 'Item',
            cell: info => (
                <div>
                    <div className="font-medium">{info.getValue()}</div>
                    <div className="text-xs text-muted-foreground">{[info.row.original.brand, info.row.original.itemModel].filter(Boolean).join(' · ') || info.row.original.category}</div>
                </div>
            ),
        }),
        column.accessor('serialNumber', { header: 'Serial', cell: info => <span className="font-mono text-xs">{info.getValue()}</span> }),
        column.accessor('category', { header: 'Category' }),
        column.accessor('baseRentalPrice', { header: 'Rate / day', meta: { align: 'right' }, cell: info => <span className="tabular-nums">{formatCurrency(info.getValue())}</span> }),
        column.accessor('updatedAt', { header: 'Marked damaged', cell: info => <span className="text-muted-foreground">{formatRelative(info.getValue())}</span> }),
        column.accessor('notes', { header: 'Notes', enableSorting: false, cell: info => <span className="line-clamp-1 max-w-56 text-muted-foreground">{info.getValue() || '—'}</span> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Damaged Items"
                description="Items marked damaged during returns. Repair them or send them for maintenance."
                actions={<Button variant="outline" asChild><Link to="/admin/inventory"><ArrowLeft /> All inventory</Link></Button>}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Damaged" value={damaged.data?.length ?? 0} icon={Wrench} tone="danger" loading={damaged.isLoading} hint="Out of service" />
                <StatCard
                    label="Most affected"
                    value={byCategory[0]?.[0] ?? '—'}
                    icon={Hammer}
                    tone="warning"
                    loading={damaged.isLoading}
                    hint={byCategory[0] ? `${byCategory[0][1]} item${byCategory[0][1] === 1 ? '' : 's'}` : 'No damaged items'}
                />
            </div>

            <DataTable
                data={damaged.data}
                columns={columns}
                getRowId={i => i._id}
                isLoading={damaged.isLoading}
                error={damaged.error}
                onRetry={() => damaged.refetch()}
                searchText={i => `${i.itemName} ${i.serialNumber} ${i.brand ?? ''}`}
                searchPlaceholder="Search damaged items"
                empty={{ icon: PartyPopper, title: 'Nothing damaged', description: 'Every instrument is in good shape.' }}
                renderCard={i => (
                    <MobileCard title={i.itemName} subtitle={<span className="font-mono text-xs">{i.serialNumber}</span>} actions={<RowActions actions={actionsFor(i)} />}>
                        <Detail label="Category">{i.category}</Detail>
                        <Detail label="Marked damaged">{formatRelative(i.updatedAt)}</Detail>
                        {i.notes && <Detail label="Notes" className="col-span-2">{i.notes}</Detail>}
                    </MobileCard>
                )}
            />

            <ConfirmDialog
                {...repaired.dialogProps}
                title={`Mark ${repaired.target?.itemName} as available?`}
                description="Confirm the item has been repaired and is ready to rent again."
                confirmLabel="Mark available"
                successMessage="Item is available again"
                onConfirm={() => update.mutateAsync({ id: repaired.target!._id, status: 'Available' })}
            />
            <ConfirmDialog
                {...toMaintenance.dialogProps}
                title={`Send ${toMaintenance.target?.itemName} to maintenance?`}
                description="The item stays unavailable until it is marked available again."
                confirmLabel="Send to maintenance"
                successMessage="Item sent to maintenance"
                onConfirm={() => update.mutateAsync({ id: toMaintenance.target!._id, status: 'Maintenance' })}
            />
        </>
    );
};

export default DamagedPage;
