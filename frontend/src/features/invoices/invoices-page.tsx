import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { isThisMonth } from 'date-fns';
import { toast } from 'sonner';
import { Banknote, CircleCheck, Eye, HandCoins, Plus, ReceiptText, RotateCcw, TrendingUp } from 'lucide-react';
import { useInvoices, useUpdateInvoicePayment } from '@/api/invoices';
import { getErrorMessage } from '@/lib/api';
import { PAYMENT_METHODS, SIMPLE_PAYMENT_STATUSES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/format';
import { fullName } from '@/lib/utils';
import type { Invoice, SimplePaymentStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { NewInvoiceDialog, ViewInvoiceDialog } from './invoice-dialogs';

const references = (inv: Invoice) => [...inv.productRentals.map(r => r.rentalId), ...inv.studioRentals.map(b => b.bookingId)];

const column = createColumnHelper<Invoice>();

const InvoicesPage = () => {
    const invoices = useInvoices();
    const updatePayment = useUpdateInvoicePayment();
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewing, setViewing] = useState<Invoice | null>(null);
    const [status, setStatus] = useState('All');
    const [method, setMethod] = useState('All');

    const newOpen = searchParams.get('new') === '1';
    const setNewOpen = (open: boolean) => setSearchParams(open ? { new: '1' } : {}, { replace: true });

    const data = useMemo(
        () => (invoices.data ?? []).filter(i => (status === 'All' || i.paymentStatus === status) && (method === 'All' || i.paymentMethod === method)),
        [invoices.data, status, method],
    );

    const stats = useMemo(() => {
        const all = invoices.data ?? [];
        const paid = all.filter(i => i.paymentStatus === 'Paid');
        return {
            count: all.length,
            collected: paid.reduce((s, i) => s + i.totalAmount, 0),
            outstanding: all.filter(i => i.paymentStatus === 'Pending').reduce((s, i) => s + i.totalAmount, 0),
            thisMonth: paid.filter(i => isThisMonth(new Date(i.paidAt ?? i.createdAt))).reduce((s, i) => s + i.totalAmount, 0),
        };
    }, [invoices.data]);

    const setPayment = async (inv: Invoice, next: SimplePaymentStatus) => {
        try {
            await updatePayment.mutateAsync({ id: inv._id, paymentStatus: next });
            toast.success(`${inv.invoiceId} marked ${next.toLowerCase()}`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const actionsFor = (inv: Invoice): RowAction[] => [
        { label: 'View & print', icon: <Eye />, onSelect: () => setViewing(inv) },
        { label: 'Mark as paid', icon: <CircleCheck />, onSelect: () => setPayment(inv, 'Paid'), hidden: inv.paymentStatus === 'Paid' },
        { label: 'Mark as pending', icon: <RotateCcw />, onSelect: () => setPayment(inv, 'Pending'), hidden: inv.paymentStatus === 'Pending' },
    ];

    const columns = [
        column.accessor('invoiceId', {
            header: 'Invoice',
            cell: info => (
                <div>
                    <div className="font-mono text-xs font-medium">{info.getValue()}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(info.row.original.createdAt)}</div>
                </div>
            ),
        }),
        column.accessor(i => fullName(i.customer), { id: 'customer', header: 'Customer', cell: info => <span className="font-medium">{info.getValue()}</span> }),
        column.accessor(i => references(i).join(', '), {
            id: 'linked',
            header: 'Linked to',
            enableSorting: false,
            cell: info => <span className="line-clamp-1 max-w-48 font-mono text-xs text-muted-foreground">{info.getValue() || 'Manual'}</span>,
        }),
        column.accessor('totalAmount', { header: 'Amount', meta: { align: 'right' }, cell: info => <span className="font-medium tabular-nums">{formatCurrency(info.getValue())}</span> }),
        column.accessor('paymentMethod', { header: 'Method' }),
        column.accessor('paymentStatus', { header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor(i => i.createdBy?.name ?? '—', { id: 'issuedBy', header: 'Issued by', cell: info => <span className="text-muted-foreground">{info.getValue()}</span> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Invoices"
                description="Bill rentals, studio sessions and extras, and track what has been paid."
                actions={<Button onClick={() => setNewOpen(true)}><Plus /> New invoice</Button>}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Invoices" value={stats.count} icon={ReceiptText} tone="primary" loading={invoices.isLoading} hint="All time" />
                <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={Banknote} tone="success" loading={invoices.isLoading} hint="Paid invoices" />
                <StatCard label="Outstanding" value={formatCurrency(stats.outstanding)} icon={HandCoins} tone="warning" loading={invoices.isLoading} hint="Awaiting payment" />
                <StatCard label="This month" value={formatCurrency(stats.thisMonth)} icon={TrendingUp} tone="violet" loading={invoices.isLoading} hint="Collected" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                getRowId={i => i._id}
                isLoading={invoices.isLoading}
                error={invoices.error}
                onRetry={() => invoices.refetch()}
                onRowClick={setViewing}
                searchText={i => `${i.invoiceId} ${fullName(i.customer)} ${i.customer?.phone ?? ''} ${references(i).join(' ')}`}
                searchPlaceholder="Search invoice, customer or rental"
                toolbar={
                    <>
                        <NativeSelect aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="All">All statuses</option>
                            {SIMPLE_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                        <NativeSelect aria-label="Filter by payment method" value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="All">All methods</option>
                            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                        </NativeSelect>
                    </>
                }
                empty={{
                    icon: ReceiptText,
                    title: 'No invoices yet',
                    description: 'Invoices are created from QR checkout, or manually here.',
                    action: <Button onClick={() => setNewOpen(true)}><Plus /> New invoice</Button>,
                }}
                renderCard={i => (
                    <MobileCard
                        title={fullName(i.customer)}
                        subtitle={<span className="font-mono text-xs">{i.invoiceId}</span>}
                        badge={<StatusBadge status={i.paymentStatus} />}
                        actions={<RowActions actions={actionsFor(i)} />}
                        onClick={() => setViewing(i)}
                    >
                        <Detail label="Amount">{formatCurrency(i.totalAmount)}</Detail>
                        <Detail label="Date">{formatDate(i.createdAt)}</Detail>
                        <Detail label="Method">{i.paymentMethod}</Detail>
                        <Detail label="Linked">{references(i).join(', ') || 'Manual'}</Detail>
                    </MobileCard>
                )}
            />

            <NewInvoiceDialog open={newOpen} onOpenChange={setNewOpen} />
            <ViewInvoiceDialog invoice={viewing} onOpenChange={open => !open && setViewing(null)} />
        </>
    );
};

export default InvoicesPage;
