import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Archive, Ban, ShieldCheck, Trash2, UserPlus, UserRound, Users, Pencil, UserCheck, CalendarPlus } from 'lucide-react';
import { useArchiveCustomer, useCustomers, useDeleteCustomer, useToggleBlacklist } from '@/api/customers';
import { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { fullName, initials } from '@/lib/utils';
import type { Customer } from '@/types/api';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import { useNow } from '@/hooks/use-now';
import { CustomerDialog } from './customer-dialog';

const Avatar = ({ customer }: { customer: Customer }) => (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(fullName(customer))}</span>
);

const column = createColumnHelper<Customer>();

const CustomersPage = () => {
    const navigate = useNavigate();
    const customers = useCustomers();
    const toggleBlacklist = useToggleBlacklist();
    const archiveCustomer = useArchiveCustomer();
    const deleteCustomer = useDeleteCustomer();
    const [searchParams, setSearchParams] = useSearchParams();
    const [editing, setEditing] = useState<Customer | null>(null);
    const [filter, setFilter] = useState('All');
    const now = useNow();
    const archiveConfirm = useConfirm<Customer>();
    const deleteConfirm = useConfirm<Customer>();
    const blacklistConfirm = useConfirm<Customer>();

    const isNew = searchParams.get('new') === '1';
    const dialogOpen = isNew || editing !== null;
    const closeDialog = () => { setEditing(null); if (isNew) setSearchParams({}, { replace: true }); };

    const data = useMemo(
        () => (customers.data ?? []).filter(c => filter === 'All' || (filter === 'Blacklisted' ? c.isBlacklisted : !c.isBlacklisted)),
        [customers.data, filter],
    );

    const stats = useMemo(() => {
        const all = customers.data ?? [];
        const monthAgo = now - 30 * 86_400_000;
        return {
            total: all.length,
            fresh: all.filter(c => new Date(c.createdAt).getTime() >= monthAgo).length,
            blacklisted: all.filter(c => c.isBlacklisted).length,
        };
    }, [customers.data, now]);

    const unblock = async (c: Customer) => {
        try {
            await toggleBlacklist.mutateAsync(c._id);
            toast.success(`${fullName(c)} can rent again`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const actionsFor = (c: Customer): RowAction[] => [
        { label: 'View profile', icon: <UserRound />, onSelect: () => navigate(`/admin/customers/${c._id}/profile`) },
        { label: 'Edit', icon: <Pencil />, onSelect: () => setEditing(c) },
        { label: 'Remove from blacklist', icon: <UserCheck />, onSelect: () => unblock(c), hidden: !c.isBlacklisted },
        { label: 'Archive', icon: <Archive />, onSelect: () => archiveConfirm.open(c) },
        { label: 'Blacklist', icon: <Ban />, onSelect: () => blacklistConfirm.open(c), destructive: true, hidden: c.isBlacklisted },
        { label: 'Delete', icon: <Trash2 />, onSelect: () => deleteConfirm.open(c), destructive: true },
    ];

    const columns = [
        column.accessor(c => fullName(c), {
            id: 'name',
            header: 'Customer',
            cell: info => (
                <div className="flex items-center gap-3">
                    <Avatar customer={info.row.original} />
                    <div className="min-w-0">
                        <div className="truncate font-medium">{info.getValue()}</div>
                        <div className="truncate text-xs text-muted-foreground">{info.row.original.email || 'No email'}</div>
                    </div>
                </div>
            ),
        }),
        column.accessor('phone', { header: 'Phone', cell: info => <span className="tabular-nums">{info.getValue()}</span> }),
        column.accessor('nicOrPassport', { header: 'NIC / passport', cell: info => <span className="font-mono text-xs">{info.getValue()}</span> }),
        column.accessor(c => (c.isBlacklisted ? 'Blacklisted' : 'Active'), { id: 'status', header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor('createdAt', { header: 'Joined', cell: info => <span className="text-muted-foreground">{formatDate(info.getValue())}</span> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Customers"
                description="People who rent instruments or book the studio."
                actions={<Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><UserPlus /> Add customer</Button>}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <StatCard label="Customers" value={stats.total} icon={Users} tone="primary" loading={customers.isLoading} hint="Active records" />
                <StatCard label="New" value={stats.fresh} icon={CalendarPlus} tone="success" loading={customers.isLoading} hint="Last 30 days" />
                <StatCard label="Blacklisted" value={stats.blacklisted} icon={ShieldCheck} tone="danger" loading={customers.isLoading} hint="Can't rent or book" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                getRowId={c => c._id}
                isLoading={customers.isLoading}
                error={customers.error}
                onRetry={() => customers.refetch()}
                onRowClick={c => navigate(`/admin/customers/${c._id}/profile`)}
                searchText={c => `${fullName(c)} ${c.phone} ${c.nicOrPassport} ${c.email ?? ''}`}
                searchPlaceholder="Search name, phone, NIC or email"
                initialSorting={[{ id: 'name', desc: false }]}
                toolbar={
                    <NativeSelect aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="All">All customers</option>
                        <option value="Active">Active</option>
                        <option value="Blacklisted">Blacklisted</option>
                    </NativeSelect>
                }
                empty={{
                    icon: Users,
                    title: 'No customers yet',
                    description: 'Add a customer before creating their first rental.',
                    action: <Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><UserPlus /> Add customer</Button>,
                }}
                renderCard={c => (
                    <MobileCard
                        title={fullName(c)}
                        subtitle={c.phone}
                        badge={<StatusBadge status={c.isBlacklisted ? 'Blacklisted' : 'Active'} />}
                        actions={<RowActions actions={actionsFor(c)} />}
                        onClick={() => navigate(`/admin/customers/${c._id}/profile`)}
                    >
                        <Detail label="NIC / passport"><span className="font-mono text-xs">{c.nicOrPassport}</span></Detail>
                        <Detail label="Joined">{formatDate(c.createdAt)}</Detail>
                    </MobileCard>
                )}
            />

            <CustomerDialog open={dialogOpen} customer={editing} onOpenChange={open => !open && closeDialog()} />
            <ConfirmDialog
                {...blacklistConfirm.dialogProps}
                tone="destructive"
                title={`Blacklist ${blacklistConfirm.target ? fullName(blacklistConfirm.target) : ''}?`}
                description="They won't be able to rent items or book the studio until you remove them from the blacklist."
                confirmLabel="Blacklist"
                successMessage="Customer blacklisted"
                onConfirm={() => toggleBlacklist.mutateAsync(blacklistConfirm.target!._id)}
            />
            <ConfirmDialog
                {...archiveConfirm.dialogProps}
                title={`Archive ${archiveConfirm.target ? fullName(archiveConfirm.target) : ''}?`}
                description="Archived customers are hidden from lists and pickers. Customers with items out can't be archived."
                confirmLabel="Archive"
                successMessage="Customer archived"
                onConfirm={() => archiveCustomer.mutateAsync(archiveConfirm.target!._id)}
            />
            <ConfirmDialog
                {...deleteConfirm.dialogProps}
                tone="destructive"
                title={`Delete ${deleteConfirm.target ? fullName(deleteConfirm.target) : ''}?`}
                description="This permanently removes the customer. Customers with rental or invoice history can't be deleted — archive them instead."
                confirmLabel="Delete permanently"
                successMessage="Customer deleted"
                onConfirm={() => deleteCustomer.mutateAsync(deleteConfirm.target!._id)}
            />
        </>
    );
};

export default CustomersPage;
