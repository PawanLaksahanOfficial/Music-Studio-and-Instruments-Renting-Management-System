import { useCallback, useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { roomsAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, StatusBadge, TableSkeleton } from '../components/ui';
import { currency } from '../utils/format';
import type { Room } from '../types/api';

interface FormState {
    name: string;
    hourlyRate: string;
    capacity: string;
    description: string;
    isActive: boolean;
}

const EMPTY: FormState = { name: '', hourlyRate: '', capacity: '', description: '', isActive: true };

/**
 * Rooms used to be free text on each booking, so a typo created a phantom room
 * that conflicted with nothing. They are now records with their own rate.
 */
const RoomsPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Room | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState<Room | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        roomsAPI
            .getAll(true)
            .then(setRooms)
            .catch(err => setError(errorMessage(err)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFieldErrors({});
        setFormOpen(true);
    };

    const openEdit = (room: Room) => {
        setEditing(room);
        setForm({
            name: room.name,
            hourlyRate: String(room.hourlyRate),
            capacity: room.capacity ? String(room.capacity) : '',
            description: room.description ?? '',
            isActive: room.isActive,
        });
        setFieldErrors({});
        setFormOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});

        const payload = {
            name: form.name,
            hourlyRate: Number(form.hourlyRate),
            capacity: form.capacity ? Number(form.capacity) : undefined,
            description: form.description || undefined,
            isActive: form.isActive,
        };

        try {
            if (editing) {
                await roomsAPI.update(editing._id, payload);
                toast.success('Room updated');
            } else {
                await roomsAPI.create(payload);
                toast.success('Room added');
            }
            setFormOpen(false);
            load();
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

    const confirmDelete = async () => {
        try {
            await roomsAPI.remove(toDelete!._id);
            toast.success('Room deleted');
            load();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setToDelete(null);
        }
    };

    return (
        <>
            <PageHeader
                title="Studio rooms"
                subtitle="Bookings are priced from each room's hourly rate."
                actions={
                    <button type="button" className="btn btn--primary" onClick={openCreate}>
                        + Add room
                    </button>
                }
            />

            {error && <ErrorState message={error} onRetry={load} />}

            {loading ? (
                <TableSkeleton cols={5} />
            ) : rooms.length === 0 && !error ? (
                <div className="table-wrap">
                    <EmptyState
                        icon="🚪"
                        title="No rooms yet"
                        hint="Add a room before taking studio bookings."
                        action={
                            <button type="button" className="btn btn--primary" onClick={openCreate}>
                                + Add room
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Room</th>
                                <th scope="col" className="table__num">
                                    Hourly rate
                                </th>
                                <th scope="col" className="table__num">
                                    Capacity
                                </th>
                                <th scope="col">Status</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(room => (
                                <tr key={room._id}>
                                    <td data-label="Room">
                                        <strong>{room.name}</strong>
                                        {room.description && <div className="faint text-sm">{room.description}</div>}
                                    </td>
                                    <td data-label="Hourly rate" className="table__num">
                                        {currency(room.hourlyRate)}
                                    </td>
                                    <td data-label="Capacity" className="table__num">
                                        {room.capacity ?? '—'}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={room.isActive ? 'Active' : 'Inactive'} />
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            <button type="button" className="btn btn--sm" onClick={() => openEdit(room)}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--sm btn--danger"
                                                onClick={() => setToDelete(room)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? `Edit ${editing.name}` : 'Add room'}
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setFormOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" form="room-form" className="btn btn--primary" disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            {editing ? 'Save changes' : 'Add room'}
                        </button>
                    </>
                }
            >
                <form id="room-form" onSubmit={handleSubmit} className="stack">
                    <Field label="Room name" htmlFor="name" required error={fieldErrors.name}>
                        <input
                            id="name"
                            className="input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </Field>

                    <Field
                        label="Hourly rate (Rs.)"
                        htmlFor="hourlyRate"
                        required
                        error={fieldErrors.hourlyRate}
                        hint="Bookings are priced from this. Changing it does not re-price existing bookings."
                    >
                        <input
                            id="hourlyRate"
                            className="input"
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.hourlyRate}
                            onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Capacity" htmlFor="capacity" error={fieldErrors.capacity}>
                        <input
                            id="capacity"
                            className="input"
                            type="number"
                            min={1}
                            value={form.capacity}
                            onChange={e => setForm({ ...form, capacity: e.target.value })}
                        />
                    </Field>

                    <Field label="Description" htmlFor="description" error={fieldErrors.description}>
                        <textarea
                            id="description"
                            className="textarea"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </Field>

                    <label className="row" style={{ gap: 'var(--sp-2)' }}>
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span>Available for booking</span>
                    </label>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete room"
                message={`Permanently delete "${toDelete?.name}"? Rooms with existing bookings cannot be deleted — mark them unavailable instead.`}
                confirmLabel="Delete"
            />
        </>
    );
};

export default RoomsPage;
