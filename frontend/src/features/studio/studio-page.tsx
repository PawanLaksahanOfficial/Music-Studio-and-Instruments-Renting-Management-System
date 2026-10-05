import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { isToday, isWithinInterval, endOfWeek, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { Archive, Ban, CalendarCheck, CalendarDays, CircleCheck, Clock, MicVocal, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useArchiveStudioBooking, useDeleteStudioBooking, useStudioBookings, useStudioRooms, useUpdateStudioBooking } from '@/api/studio';
import { getErrorMessage } from '@/lib/api';
import { STUDIO_STATUSES } from '@/lib/constants';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { fullName } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { StudioBooking, StudioStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader, StatCard } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import { useNow } from '@/hooks/use-now';
import { BookingDialog } from './booking-dialog';

const When = ({ booking }: { booking: StudioBooking }) => (
    <div>
        <div className="font-medium">{isToday(new Date(booking.startTime)) ? 'Today' : formatDate(booking.startTime)}</div>
        <div className="text-xs tabular-nums text-muted-foreground">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</div>
    </div>
);

const column = createColumnHelper<StudioBooking>();

const StudioPage = () => {
    const { isAdmin } = useAuth();
    const bookings = useStudioBookings();
    const rooms = useStudioRooms();
    const updateBooking = useUpdateStudioBooking();
    const archiveBooking = useArchiveStudioBooking();
    const deleteBooking = useDeleteStudioBooking();
    const [searchParams, setSearchParams] = useSearchParams();
    const [editing, setEditing] = useState<StudioBooking | null>(null);
    const [status, setStatus] = useState('All');
    const [room, setRoom] = useState('All');
    const [when, setWhen] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const now = useNow();
    const archiveConfirm = useConfirm<StudioBooking>();
    const deleteConfirm = useConfirm<StudioBooking>();

    const isNew = searchParams.get('new') === '1';
    const dialogOpen = isNew || editing !== null;
    const closeDialog = () => { setEditing(null); if (isNew) setSearchParams({}, { replace: true }); };

    const data = useMemo(() => {
        return (bookings.data ?? []).filter(b =>
            (status === 'All' || b.status === status)
            && (room === 'All' || b.roomName === room)
            && (when === 'all' || (when === 'upcoming' ? new Date(b.endTime).getTime() >= now : new Date(b.endTime).getTime() < now)));
    }, [bookings.data, status, room, when, now]);

    const stats = useMemo(() => {
        const all = (bookings.data ?? []).filter(b => b.status !== 'Cancelled');
        const week = { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) };
        return {
            today: all.filter(b => isToday(new Date(b.startTime))).length,
            upcoming: all.filter(b => b.status === 'Confirmed' && new Date(b.startTime).getTime() > now).length,
            weekHours: all.filter(b => isWithinInterval(new Date(b.startTime), week)).reduce((sum, b) => sum + (b.durationHours ?? 0), 0),
            unpaid: all.filter(b => b.paymentStatus === 'Pending').reduce((sum, b) => sum + b.totalAmount, 0),
        };
    }, [bookings.data, now]);

    const setBookingStatus = async (booking: StudioBooking, next: StudioStatus) => {
        try {
            await updateBooking.mutateAsync({ id: booking._id, status: next });
            toast.success(`${booking.bookingId} marked ${next.toLowerCase()}`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const actionsFor = (b: StudioBooking): RowAction[] => [
        { label: 'Edit', icon: <Pencil />, onSelect: () => setEditing(b) },
        { label: 'Mark completed', icon: <CircleCheck />, onSelect: () => setBookingStatus(b, 'Completed'), hidden: b.status !== 'Confirmed' },
        { label: 'Cancel booking', icon: <Ban />, onSelect: () => setBookingStatus(b, 'Cancelled'), hidden: b.status !== 'Confirmed' },
        { label: 'Archive', icon: <Archive />, onSelect: () => archiveConfirm.open(b) },
        { label: 'Delete', icon: <Trash2 />, onSelect: () => deleteConfirm.open(b), destructive: true, hidden: !isAdmin },
    ];

    const columns = [
        column.accessor('bookingId', { header: 'Booking', cell: info => <span className="font-mono text-xs font-medium">{info.getValue()}</span> }),
        column.accessor(b => fullName(b.customer), {
            id: 'customer',
            header: 'Customer',
            cell: info => (
                <div>
                    <div className="font-medium">{info.getValue()}</div>
                    <div className="text-xs text-muted-foreground">{info.row.original.customer?.phone}</div>
                </div>
            ),
        }),
        column.accessor('roomName', { header: 'Room' }),
        column.accessor('startTime', { header: 'When', cell: info => <When booking={info.row.original} /> }),
        column.accessor('durationHours', { header: 'Hours', meta: { align: 'right' }, cell: info => <span className="tabular-nums">{info.getValue() ?? '—'}</span> }),
        column.accessor('totalAmount', { header: 'Total', meta: { align: 'right' }, cell: info => <span className="font-medium tabular-nums">{formatCurrency(info.getValue())}</span> }),
        column.accessor('status', { header: 'Status', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor('paymentStatus', { header: 'Payment', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Studio Bookings"
                description="Schedule rooms and sessions. Double bookings are blocked automatically."
                actions={<Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><Plus /> New booking</Button>}
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard label="Today" value={stats.today} icon={CalendarDays} tone="primary" loading={bookings.isLoading} hint="Sessions today" />
                <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarCheck} tone="info" loading={bookings.isLoading} hint="Confirmed" />
                <StatCard label="This week" value={`${Math.round(stats.weekHours * 10) / 10} h`} icon={Clock} tone="success" loading={bookings.isLoading} hint="Hours booked" />
                <StatCard label="Unpaid" value={formatCurrency(stats.unpaid)} icon={Wallet} tone="violet" loading={bookings.isLoading} hint="Pending payment" />
            </div>

            <DataTable
                data={data}
                columns={columns}
                getRowId={b => b._id}
                isLoading={bookings.isLoading}
                error={bookings.error}
                onRetry={() => bookings.refetch()}
                searchText={b => `${b.bookingId} ${fullName(b.customer)} ${b.customer?.phone ?? ''} ${b.roomName} ${b.notes ?? ''}`}
                searchPlaceholder="Search booking, customer or room"
                initialSorting={[{ id: 'startTime', desc: when === 'past' }]}
                toolbar={
                    <>
                        <NativeSelect aria-label="Time range" value={when} onChange={e => setWhen(e.target.value as typeof when)}>
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past</option>
                            <option value="all">All dates</option>
                        </NativeSelect>
                        <NativeSelect aria-label="Filter by room" value={room} onChange={e => setRoom(e.target.value)}>
                            <option value="All">All rooms</option>
                            {(rooms.data ?? []).map(r => <option key={r}>{r}</option>)}
                        </NativeSelect>
                        <NativeSelect aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="All">All statuses</option>
                            {STUDIO_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                    </>
                }
                empty={{
                    icon: MicVocal,
                    title: 'No studio bookings',
                    description: 'Book a room for a recording or rehearsal session.',
                    action: <Button onClick={() => setSearchParams({ new: '1' }, { replace: true })}><Plus /> New booking</Button>,
                }}
                renderCard={b => (
                    <MobileCard
                        title={fullName(b.customer)}
                        subtitle={`${b.roomName} · ${b.bookingId}`}
                        badge={<StatusBadge status={b.status} />}
                        actions={<RowActions actions={actionsFor(b)} />}
                    >
                        <Detail label="When"><When booking={b} /></Detail>
                        <Detail label="Total">{formatCurrency(b.totalAmount)}</Detail>
                        <Detail label="Hours">{b.durationHours ?? '—'}</Detail>
                        <Detail label="Payment"><StatusBadge status={b.paymentStatus} /></Detail>
                    </MobileCard>
                )}
            />

            <BookingDialog open={dialogOpen} booking={editing} onOpenChange={open => !open && closeDialog()} />
            <ConfirmDialog
                {...archiveConfirm.dialogProps}
                title={`Archive ${archiveConfirm.target?.bookingId}?`}
                description="The booking moves to the archive. You can restore it later."
                confirmLabel="Archive"
                successMessage="Booking archived"
                onConfirm={() => archiveBooking.mutateAsync(archiveConfirm.target!._id)}
            />
            <ConfirmDialog
                {...deleteConfirm.dialogProps}
                tone="destructive"
                title={`Delete ${deleteConfirm.target?.bookingId}?`}
                description="This permanently removes the booking. Invoiced bookings can't be deleted."
                confirmLabel="Delete permanently"
                successMessage="Booking deleted"
                onConfirm={() => deleteBooking.mutateAsync(deleteConfirm.target!._id)}
            />
        </>
    );
};

export default StudioPage;
