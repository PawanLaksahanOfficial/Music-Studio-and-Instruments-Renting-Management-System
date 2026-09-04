import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersAPI, inventoryAPI, rentalsAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDate, toDateInput } from '../utils/format';
import type { Customer, InventoryItem, Rental, RentalQuote } from '../types/api';

const STATUSES = ['Rented', 'Overdue', 'Returned'];

const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toDateInput(d);
};

const ProductRentals = () => {
    const { isAdmin } = useAuth();
    const query = usePagedQuery<Rental>(params => rentalsAPI.getAll(params));

    const [createOpen, setCreateOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [available, setAvailable] = useState<InventoryItem[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    const [customerId, setCustomerId] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [rentalDate, setRentalDate] = useState(addDays(0));
    const [dueDate, setDueDate] = useState(addDays(3));
    const [notes, setNotes] = useState('');
    const [quote, setQuote] = useState<RentalQuote | null>(null);
    const [quoting, setQuoting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [extending, setExtending] = useState<Rental | null>(null);
    const [newDueDate, setNewDueDate] = useState('');
    const [toArchive, setToArchive] = useState<Rental | null>(null);
    const [toDelete, setToDelete] = useState<Rental | null>(null);

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const [customerPage, inventoryPage] = await Promise.all([
                customersAPI.getAll({ limit: 200 }),
                inventoryAPI.getAll({ limit: 200, status: 'Available' }),
            ]);
            setCustomers(customerPage.data.filter(c => !c.isBlacklisted));
            setAvailable(inventoryPage.data);
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    const openCreate = () => {
        setCustomerId('');
        setSelectedIds([]);
        setRentalDate(addDays(0));
        setDueDate(addDays(3));
        setNotes('');
        setQuote(null);
        setFieldErrors({});
        setCreateOpen(true);
        void loadOptions();
    };

    // The price shown is the server's, requested live as the basket changes —
    // so the figure the clerk quotes is the figure that will be charged.
    useEffect(() => {
        if (!createOpen || selectedIds.length === 0 || !dueDate) {
            setQuote(null);
            return;
        }
        let active = true;
        setQuoting(true);
        rentalsAPI
            .quote(selectedIds.map(itemId => ({ itemId, quantity: 1 })), rentalDate, dueDate)
            .then(result => {
                if (active) setQuote(result);
            })
            .catch(() => {
                if (active) setQuote(null);
            })
            .finally(() => {
                if (active) setQuoting(false);
            });
        return () => {
            active = false;
        };
    }, [createOpen, selectedIds, rentalDate, dueDate]);

    const toggleItem = (id: string) =>
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});
        try {
            const rental = await rentalsAPI.create({
                customerId,
                items: selectedIds.map(itemId => ({ itemId, quantity: 1 })),
                rentalDate,
                dueDate,
                notes: notes || undefined,
            });
            toast.success(`Rental ${rental.rentalId} created — ${currency(rental.totalAmount)}`);
            setCreateOpen(false);
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

    const handleExtend = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await rentalsAPI.extend(extending!._id, newDueDate);
            toast.success(`Extended to ${formatDate(updated.dueDate)} — new total ${currency(updated.totalAmount)}`);
            setExtending(null);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
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
                title="Product rentals"
                subtitle={query.meta ? `${query.meta.total} rentals` : 'Loading…'}
                actions={
                    <button type="button" className="btn btn--primary" onClick={openCreate}>
                        + New rental
                    </button>
                }
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="rental-search">
                    Search rentals
                </label>
                <input
                    id="rental-search"
                    className="input"
                    type="search"
                    placeholder="Search by rental ID…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
                <label className="sr-only" htmlFor="rental-status">
                    Filter by status
                </label>
                <select
                    id="rental-status"
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
                        icon="🎸"
                        title="No rentals found"
                        hint={query.search ? 'Try a different search term.' : 'Create a rental to get started.'}
                        action={
                            !query.search ? (
                                <button type="button" className="btn btn--primary" onClick={openCreate}>
                                    + New rental
                                </button>
                            ) : undefined
                        }
                    />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Rental</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Items</th>
                                <th scope="col">Due</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Total
                                </th>
                                <th scope="col">Payment</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(rental => (
                                <tr key={rental._id}>
                                    <td data-label="Rental" className="table__mono">
                                        {rental.rentalId}
                                    </td>
                                    <td data-label="Customer">
                                        {rental.customer ? (
                                            <Link to={`/admin/customers/${rental.customer._id}`}>
                                                {rental.customer.firstName} {rental.customer.lastName}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td data-label="Items" className="table__truncate">
                                        {rental.items
                                            .map(i => (typeof i.itemId === 'string' ? null : i.itemId?.itemName))
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                    </td>
                                    <td data-label="Due">{formatDate(rental.dueDate)}</td>
                                    <td data-label="Status">
                                        <StatusBadge status={rental.status} />
                                    </td>
                                    <td data-label="Total" className="table__num">
                                        {currency(rental.totalAmount)}
                                    </td>
                                    <td data-label="Payment">
                                        <StatusBadge status={rental.paymentStatus} />
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            {rental.status !== 'Returned' && (
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => {
                                                        setExtending(rental);
                                                        setNewDueDate(toDateInput(rental.dueDate));
                                                    }}
                                                >
                                                    Extend
                                                </button>
                                            )}
                                            {rental.status === 'Returned' && (
                                                <button
                                                    type="button"
                                                    className="btn btn--sm"
                                                    onClick={() => setToArchive(rental)}
                                                >
                                                    Archive
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className="btn btn--sm btn--danger"
                                                    onClick={() => setToDelete(rental)}
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

            {/* ─── New rental ─── */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="New rental"
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setCreateOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="rental-form"
                            className="btn btn--primary"
                            disabled={saving || !customerId || selectedIds.length === 0}
                        >
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Create rental
                        </button>
                    </>
                }
            >
                <form id="rental-form" onSubmit={handleCreate} className="stack">
                    <div className="form-grid">
                        <Field label="Customer" htmlFor="customerId" required error={fieldErrors.customerId}>
                            <select
                                id="customerId"
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

                        <Field label="Rental date" htmlFor="rentalDate" required error={fieldErrors.rentalDate}>
                            <input
                                id="rentalDate"
                                className="input"
                                type="date"
                                value={rentalDate}
                                onChange={e => setRentalDate(e.target.value)}
                                required
                            />
                        </Field>

                        <Field label="Due date" htmlFor="dueDate" required error={fieldErrors.dueDate}>
                            <input
                                id="dueDate"
                                className="input"
                                type="date"
                                value={dueDate}
                                min={rentalDate}
                                onChange={e => setDueDate(e.target.value)}
                                required
                            />
                        </Field>
                    </div>

                    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                        <legend className="field__label" style={{ marginBottom: 'var(--sp-2)' }}>
                            Available items ({selectedIds.length} selected)
                        </legend>

                        {optionsLoading ? (
                            <div className="skeleton" style={{ height: 120 }} />
                        ) : available.length === 0 ? (
                            <p className="muted">No items are currently available to rent.</p>
                        ) : (
                            <div
                                className="stack"
                                style={{
                                    gap: 0,
                                    maxHeight: 240,
                                    overflowY: 'auto',
                                    border: '1px solid var(--c-border)',
                                    borderRadius: 'var(--r-md)',
                                }}
                            >
                                {available.map(item => (
                                    <label
                                        key={item._id}
                                        className="row"
                                        style={{
                                            padding: 'var(--sp-2) var(--sp-3)',
                                            borderBottom: '1px solid var(--c-border)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(item._id)}
                                            onChange={() => toggleItem(item._id)}
                                        />
                                        <span className="grow">
                                            <strong>{item.itemName}</strong>{' '}
                                            <span className="faint text-sm mono">{item.serialNumber}</span>
                                        </span>
                                        <span className="num">{currency(item.baseRentalPrice)}/day</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </fieldset>

                    <Field label="Notes" htmlFor="notes" error={fieldErrors.notes}>
                        <textarea
                            id="notes"
                            className="textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </Field>

                    {/* Server-calculated quote — the client never names a price. */}
                    <div className="card" aria-live="polite">
                        <div className="row row--between">
                            <strong>Quoted total</strong>
                            <span className="stat__value">
                                {quoting ? <span className="spinner" aria-hidden="true" /> : currency(quote?.baseAmount ?? 0)}
                            </span>
                        </div>
                        {quote && (
                            <p className="faint text-sm mt-4">
                                {quote.days} day{quote.days === 1 ? '' : 's'} × {quote.lines.length} item
                                {quote.lines.length === 1 ? '' : 's'} · priced from the catalogue on the server
                            </p>
                        )}
                    </div>
                </form>
            </Modal>

            {/* ─── Extend ─── */}
            <Modal
                isOpen={!!extending}
                onClose={() => setExtending(null)}
                title={extending ? `Extend ${extending.rentalId}` : ''}
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setExtending(null)} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" form="extend-form" className="btn btn--primary" disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Extend rental
                        </button>
                    </>
                }
            >
                <form id="extend-form" onSubmit={handleExtend} className="stack">
                    <p className="muted">
                        Current due date: <strong>{formatDate(extending?.dueDate)}</strong>
                    </p>
                    <Field
                        label="New due date"
                        htmlFor="newDueDate"
                        required
                        hint="The rental is re-priced for the longer period."
                    >
                        <input
                            id="newDueDate"
                            className="input"
                            type="date"
                            value={newDueDate}
                            min={toDateInput(extending?.dueDate)}
                            onChange={e => setNewDueDate(e.target.value)}
                            required
                        />
                    </Field>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!toArchive}
                onClose={() => setToArchive(null)}
                onConfirm={() =>
                    runAction(
                        () => rentalsAPI.archive(toArchive!._id),
                        'Rental archived',
                        () => setToArchive(null)
                    )
                }
                title="Archive rental"
                message={`Archive ${toArchive?.rentalId}? It moves out of the active list but stays in reports.`}
                confirmLabel="Archive"
                tone="primary"
            />

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() =>
                    runAction(() => rentalsAPI.remove(toDelete!._id), 'Rental deleted', () => setToDelete(null))
                }
                title="Delete rental permanently"
                message={`Permanently delete ${toDelete?.rentalId}? Any items still out will be returned to Available. This cannot be undone and removes the record from all reporting.`}
                confirmLabel="Delete permanently"
            />
        </>
    );
};

export default ProductRentals;
