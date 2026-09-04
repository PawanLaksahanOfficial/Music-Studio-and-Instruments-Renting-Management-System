import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersAPI, roomsAPI, studioRentalsAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDateTime, toDateTimeInput } from '../utils/format';
import type { Customer, Room, RoomAvailability, StudioRental } from '../types/api';

const STATUSES = ['Confirmed', 'Completed', 'Cancelled'];

const defaultStart = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toDateTimeInput(d);
};

const defaultEnd = () => {
    const d = new Date();
    d.setHours(d.getHours() + 3, 0, 0, 0);
    return toDateTimeInput(d);
};

const StudioRentals = () => {
    const { isAdmin } = useAuth();
    const query = usePagedQuery<StudioRental>(params => studioRentalsAPI.getAll(params));

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<StudioRental | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    const [customerId, setCustomerId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [startTime, setStartTime] = useState(defaultStart());
    const [endTime, setEndTime] = useState(defaultEnd());
    const [notes, setNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [availability, setAvailability] = useState<RoomAvailability | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [toCancel, setToCancel] = useState<StudioRental | null>(null);
    const [toDelete, setToDelete] = useState<StudioRental | null>(null);

    const loadOptions = useCallback(async () => {
        try {
            const [customerPage, roomList] = await Promise.all([
                customersAPI.getAll({ limit: 200 }),
                roomsAPI.getAll(),
            ]);
            setCustomers(customerPage.data.filter(c => !c.isBlacklisted));
            setRooms(roomList);
        } catch (err) {
            toast.error(errorMessage(err));
        }
    }, []);

    const selectedRoom = rooms.find(r => r._id === roomId);
    const durationHours =
        startTime && endTime
            ? Math.max(0, (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3_600_000)
            : 0;
    const estimate = selectedRoom ? selectedRoom.hourlyRate * durationHours : 0;

    // Shows what else is booked in that room that day, so a clash is visible
    // before submitting rather than only as a server rejection.
    useEffect(() => {
        if (!formOpen || !roomId || !startTime) {
            setAvailability(null);
            return;
        }
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        let active = true;
        setCheckingAvailability(true);
        studioRentalsAPI
            .getAvailability(roomId, dayStart.toISOString(), dayEnd.toISOString())
            .then(result => {
                if (active) setAvailability(result);
            })
            .catch(() => {
                if (active) setAvailability(null);
            })
            .finally(() => {
                if (active) setCheckingAvailability(false);
            });
        return () => {
            active = false;
        };
    }, [formOpen, roomId, startTime]);

    const openCreate = () => {
        setEditing(null);
        setCustomerId('');
        setRoomId('');
        setStartTime(defaultStart());
        setEndTime(defaultEnd());
        setNotes('');
        setFieldErrors({});
        setFormOpen(true);
        void loadOptions();
    };

    const openEdit = (booking: StudioRental) => {
        setEditing(booking);
        setCustomerId(booking.customer?._id ?? '');
        setRoomId(typeof booking.room === 'string' ? booking.room : booking.room?._id ?? '');
        setStartTime(toDateTimeInput(booking.startTime));
        setEndTime(toDateTimeInput(booking.endTime));
        setNotes(booking.notes ?? '');
        setFieldErrors({});
        setFormOpen(true);
        void loadOptions();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});

        // datetime-local gives a local wall-clock string; send an absolute instant.
        const payload = {
            roomId,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            notes: notes || undefined,
        };

        try {
            if (editing) {
                const updated = await studioRentalsAPI.update(editing._id, payload);
                toast.success(`Booking updated — ${currency(updated.totalAmount)}`);
            } else {
                const created = await studioRentalsAPI.create({ ...payload, customerId });
                toast.success(`Booking ${created.bookingId} confirmed — ${currency(created.totalAmount)}`);
            }
            setFormOpen(false);
            query.refresh();
        } catch (err) {
            if (err instanceof ApiError && err.details?.length) {
                setFieldErrors(err.fieldErrors);
            } else {
                toast.error(errorMessage(err));
            }
        } finally {
            setSaving(false);
        }
    };

    const runAction = async (fn: () => Promise<unknown>, message: string, done: () => void) => {
        try {
            await fn();
            toast.success(message);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            done();
        }
    };

    return (
        <>
            <PageHeader
                title="Studio bookings"
                subtitle={query.meta ? `${query.meta.total} bookings` : 'Loading…'}
                actions={
                    <button type="button" className="btn btn--primary" onClick={openCreate}>
                        + New booking
                    </button>
                }
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="studio-search">
                    Search bookings
                </label>
                <input
                    id="studio-search"
                    className="input"
                    type="search"
                    placeholder="Search by booking ID or room…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
                <label className="sr-only" htmlFor="studio-status">
                    Filter by status
                </label>
                <select
                    id="studio-status"
                    className="select"
                    value={query.filters.status ?? 'All'}
                    onChange={e => query.setFilter('status', e.target.value)}
                >
                    <option value="All">All statuses</option>
                    {STATUSES.map(s => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={7} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState
                        icon="🎙️"
                        title="No bookings found"
                        hint={query.search ? 'Try a different search term.' : 'Take your first studio booking.'}
                    />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Booking</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Room</th>
                                <th scope="col">When</th>
                                <th scope="col" className="table__num">
                                    Hours
                                </th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Total
                                </th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(booking => (
                                <tr key={booking._id}>
                                    <td data-label="Booking" className="table__mono">
                                        {booking.bookingId}
                                    </td>
                                    <td data-label="Customer">
                                        {booking.customer ? (
                                            <Link to={`/admin/customers/${booking.customer._id}`}>
                                                {booking.customer.firstName} {booking.customer.lastName}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td data-label="Room">{booking.roomName}</td>
                                    <td data-label="When">
                                        {formatDateTime(booking.startTime)}
                                        <div className="faint text-sm">to {formatDateTime(booking.endTime)}</div>
                                    </td>
                                    <td data-label="Hours" className="table__num">
                                        {booking.durationHours}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td data-label="Total" className="table__num">
                                        {currency(booking.totalAmount)}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            {booking.status === 'Confirmed' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm"
                                                        onClick={() => openEdit(booking)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm"
                                                        onClick={() => setToCancel(booking)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className="btn btn--sm btn--danger"
                                                    onClick={() => setToDelete(booking)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {query.meta && <Pagination meta={query.meta} onPageChange={query.setPage} />}
                </div>
            )}

            <Modal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? `Edit ${editing.bookingId}` : 'New studio booking'}
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setFormOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="studio-form"
                            className="btn btn--primary"
                            disabled={saving || !roomId || (!editing && !customerId)}
                        >
                            {saving && <span className="spinner" aria-hidden="true" />}
                            {editing ? 'Save changes' : 'Confirm booking'}
                        </button>
                    </>
                }
            >
                <form id="studio-form" onSubmit={handleSubmit} className="stack">
                    <div className="form-grid">
                        {!editing && (
                            <Field label="Customer" htmlFor="s-customer" required error={fieldErrors.customerId}>
                                <select
                                    id="s-customer"
                                    className="select"
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a customer…</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.firstName} {c.lastName} — {c.phone}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        )}

                        <Field label="Room" htmlFor="s-room" required error={fieldErrors.roomId}>
                            <select
                                id="s-room"
                                className="select"
                                value={roomId}
                                onChange={e => setRoomId(e.target.value)}
                                required
                            >
                                <option value="">Select a room…</option>
                                {rooms.map(r => (
                                    <option key={r._id} value={r._id}>
                                        {r.name} — {currency(r.hourlyRate)}/hour
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Start" htmlFor="s-start" required error={fieldErrors.startTime}>
                            <input
                                id="s-start"
                                className="input"
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                required
                            />
                        </Field>

                        <Field label="End" htmlFor="s-end" required error={fieldErrors.endTime}>
                            <input
                                id="s-end"
                                className="input"
                                type="datetime-local"
                                value={endTime}
                                min={startTime}
                                onChange={e => setEndTime(e.target.value)}
                                required
                            />
                        </Field>
                    </div>

                    {/* Same-day bookings for the chosen room, so clashes are visible up front. */}
                    {roomId && (
                        <div className="card">
                            <div className="row row--between">
                                <strong>Already booked that day</strong>
                                {checkingAvailability && <span className="spinner" aria-hidden="true" />}
                            </div>
                            {availability && availability.bookings.length > 0 ? (
                                <ul className="stack mt-4" style={{ gap: 'var(--sp-1)', paddingLeft: '1.2em' }}>
                                    {availability.bookings
                                        .filter(b => b._id !== editing?._id)
                                        .map(b => (
                                            <li key={b._id} className="text-sm">
                                                {formatDateTime(b.startTime)} — {formatDateTime(b.endTime)}
                                                {b.customer ? ` (${b.customer.firstName} ${b.customer.lastName})` : ''}
                                            </li>
                                        ))}
                                </ul>
                            ) : (
                                <p className="muted text-sm mt-4">Nothing else booked — the room is free all day.</p>
                            )}
                        </div>
                    )}

                    <Field label="Notes" htmlFor="s-notes" error={fieldErrors.notes}>
                        <textarea
                            id="s-notes"
                            className="textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </Field>

                    <div className="card" aria-live="polite">
                        <div className="row row--between">
                            <strong>Estimated total</strong>
                            <span className="stat__value">{currency(estimate)}</span>
                        </div>
                        <p className="faint text-sm mt-4">
                            {durationHours.toFixed(2)} hours × {currency(selectedRoom?.hourlyRate ?? 0)}/hour. The
                            server recalculates this on save.
                        </p>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!toCancel}
                onClose={() => setToCancel(null)}
                onConfirm={() =>
                    runAction(
                        () => studioRentalsAPI.updateStatus(toCancel!._id, 'Cancelled'),
                        'Booking cancelled',
                        () => setToCancel(null)
                    )
                }
                title="Cancel booking"
                message={`Cancel ${toCancel?.bookingId}? The slot becomes available for someone else.`}
                confirmLabel="Cancel booking"
            />

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() =>
                    runAction(
                        () => studioRentalsAPI.remove(toDelete!._id),
                        'Booking deleted',
                        () => setToDelete(null)
                    )
                }
                title="Delete booking permanently"
                message={`Permanently delete ${toDelete?.bookingId}? This removes it from all reporting and cannot be undone.`}
                confirmLabel="Delete permanently"
            />
        </>
    );
};

export default StudioRentals;
