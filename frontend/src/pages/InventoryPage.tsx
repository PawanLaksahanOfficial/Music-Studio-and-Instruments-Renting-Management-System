import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { QRCode } from '../components/QRCode';
import { downloadQRCode } from '../utils/qrDownload';
import { EmptyState, ErrorState, Field, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, toDateInput } from '../utils/format';
import type { InventoryCategory, InventoryItem, InventoryStatus } from '../types/api';

const CATEGORIES: InventoryCategory[] = ['Instruments', 'Audio Gear', 'Cables', 'Other'];
const STATUSES: InventoryStatus[] = ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'];

interface FormState {
    itemName: string;
    category: InventoryCategory;
    brand: string;
    itemModel: string;
    serialNumber: string;
    status: InventoryStatus;
    baseRentalPrice: string;
    purchaseDate: string;
    notes: string;
}

const EMPTY: FormState = {
    itemName: '',
    category: 'Instruments',
    brand: '',
    itemModel: '',
    serialNumber: '',
    status: 'Available',
    baseRentalPrice: '',
    purchaseDate: '',
    notes: '',
};

/** The QR encodes only the id — item details are looked up from the server. */
const qrPayload = (item: InventoryItem) => item.qrCodeId;

const InventoryPage = () => {
    const { isAdmin } = useAuth();
    const query = usePagedQuery<InventoryItem>(params => inventoryAPI.getAll(params));

    const [editing, setEditing] = useState<InventoryItem | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
    const [toArchive, setToArchive] = useState<InventoryItem | null>(null);
    const [toDelete, setToDelete] = useState<InventoryItem | null>(null);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFieldErrors({});
        setFormOpen(true);
    };

    const openEdit = (item: InventoryItem) => {
        setEditing(item);
        setForm({
            itemName: item.itemName,
            category: item.category,
            brand: item.brand ?? '',
            itemModel: item.itemModel ?? '',
            serialNumber: item.serialNumber,
            status: item.status,
            baseRentalPrice: String(item.baseRentalPrice),
            purchaseDate: toDateInput(item.purchaseDate),
            notes: item.notes ?? '',
        });
        setFieldErrors({});
        setFormOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});

        const payload = {
            itemName: form.itemName,
            category: form.category,
            brand: form.brand || undefined,
            itemModel: form.itemModel || undefined,
            status: form.status,
            baseRentalPrice: Number(form.baseRentalPrice),
            purchaseDate: form.purchaseDate || undefined,
            notes: form.notes || undefined,
        };

        try {
            if (editing) {
                await inventoryAPI.update(editing._id, payload);
                toast.success(`${form.itemName} updated`);
            } else {
                await inventoryAPI.create({ ...payload, serialNumber: form.serialNumber });
                toast.success(`${form.itemName} added`);
            }
            setFormOpen(false);
            query.refresh();
        } catch (err) {
            // Field-level messages land next to their input; anything else
            // becomes a toast so it cannot be missed.
            if (err instanceof ApiError && err.details?.length) {
                setFieldErrors(err.fieldErrors);
            } else {
                toast.error(errorMessage(err));
            }
        } finally {
            setSaving(false);
        }
    };

    const runAction = async (fn: () => Promise<unknown>, successMessage: string, done: () => void) => {
        try {
            await fn();
            toast.success(successMessage);
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
                title="Inventory"
                subtitle={query.meta ? `${query.meta.total} items` : 'Loading…'}
                actions={
                    isAdmin && (
                        <button type="button" className="btn btn--primary" onClick={openCreate}>
                            + Add item
                        </button>
                    )
                }
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="inventory-search">
                    Search inventory
                </label>
                <input
                    id="inventory-search"
                    className="input"
                    type="search"
                    placeholder="Search name, serial, brand or model…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
                <label className="sr-only" htmlFor="inventory-status">
                    Filter by status
                </label>
                <select
                    id="inventory-status"
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
                <label className="sr-only" htmlFor="inventory-category">
                    Filter by category
                </label>
                <select
                    id="inventory-category"
                    className="select"
                    value={query.filters.category ?? 'All'}
                    onChange={e => query.setFilter('category', e.target.value)}
                >
                    <option value="All">All categories</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                            {c}
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
                        icon="📦"
                        title="No items found"
                        hint={query.search ? 'Try a different search term.' : 'Add your first inventory item to get started.'}
                        action={
                            isAdmin && !query.search ? (
                                <button type="button" className="btn btn--primary" onClick={openCreate}>
                                    + Add item
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
                                <th scope="col">Item</th>
                                <th scope="col">Category</th>
                                <th scope="col">Brand / model</th>
                                <th scope="col">Serial</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Daily rate
                                </th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(item => (
                                <tr key={item._id}>
                                    <td data-label="Item">
                                        <strong>{item.itemName}</strong>
                                        {item.notes && <div className="faint text-sm table__truncate">{item.notes}</div>}
                                    </td>
                                    <td data-label="Category">{item.category}</td>
                                    <td data-label="Brand / model">
                                        {[item.brand, item.itemModel].filter(Boolean).join(' — ') || '—'}
                                    </td>
                                    <td data-label="Serial" className="table__mono">
                                        {item.serialNumber}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td data-label="Daily rate" className="table__num">
                                        {currency(item.baseRentalPrice)}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            <button type="button" className="btn btn--sm" onClick={() => setQrItem(item)}>
                                                QR
                                            </button>
                                            {isAdmin && (
                                                <>
                                                    <button type="button" className="btn btn--sm" onClick={() => openEdit(item)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm"
                                                        onClick={() => setToArchive(item)}
                                                    >
                                                        Archive
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm btn--danger"
                                                        onClick={() => setToDelete(item)}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
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

            {/* ─── Create / edit ─── */}
            <Modal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? `Edit ${editing.itemName}` : 'Add inventory item'}
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setFormOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" form="inventory-form" className="btn btn--primary" disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            {editing ? 'Save changes' : 'Add item'}
                        </button>
                    </>
                }
            >
                <form id="inventory-form" onSubmit={handleSubmit} className="form-grid">
                    <Field label="Item name" htmlFor="itemName" required error={fieldErrors.itemName}>
                        <input
                            id="itemName"
                            className="input"
                            value={form.itemName}
                            onChange={e => setForm({ ...form, itemName: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Category" htmlFor="category" required error={fieldErrors.category}>
                        <select
                            id="category"
                            className="select"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value as InventoryCategory })}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Brand" htmlFor="brand" error={fieldErrors.brand}>
                        <input
                            id="brand"
                            className="input"
                            value={form.brand}
                            onChange={e => setForm({ ...form, brand: e.target.value })}
                        />
                    </Field>

                    <Field label="Model" htmlFor="itemModel" error={fieldErrors.itemModel}>
                        <input
                            id="itemModel"
                            className="input"
                            value={form.itemModel}
                            onChange={e => setForm({ ...form, itemModel: e.target.value })}
                        />
                    </Field>

                    <Field
                        label="Serial number"
                        htmlFor="serialNumber"
                        required
                        error={fieldErrors.serialNumber}
                        hint={editing ? 'The serial identifies the physical unit and cannot be changed.' : undefined}
                    >
                        <input
                            id="serialNumber"
                            className="input"
                            value={form.serialNumber}
                            onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                            disabled={!!editing}
                            required
                        />
                    </Field>

                    <Field
                        label="Daily rental price (Rs.)"
                        htmlFor="baseRentalPrice"
                        required
                        error={fieldErrors.baseRentalPrice}
                    >
                        <input
                            id="baseRentalPrice"
                            className="input"
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.baseRentalPrice}
                            onChange={e => setForm({ ...form, baseRentalPrice: e.target.value })}
                            required
                        />
                    </Field>

                    <Field
                        label="Status"
                        htmlFor="status"
                        error={fieldErrors.status}
                        hint={editing?.status === 'Rented' ? 'Locked while the item is out on rental.' : undefined}
                    >
                        <select
                            id="status"
                            className="select"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value as InventoryStatus })}
                            disabled={editing?.status === 'Rented'}
                        >
                            {STATUSES.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Purchase date" htmlFor="purchaseDate" error={fieldErrors.purchaseDate}>
                        <input
                            id="purchaseDate"
                            className="input"
                            type="date"
                            value={form.purchaseDate}
                            onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                        />
                    </Field>

                    <Field label="Notes" htmlFor="notes" full error={fieldErrors.notes}>
                        <textarea
                            id="notes"
                            className="textarea"
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                        />
                    </Field>
                </form>
            </Modal>

            {/* ─── QR ─── */}
            <Modal
                isOpen={!!qrItem}
                onClose={() => setQrItem(null)}
                title={qrItem ? `QR code — ${qrItem.itemName}` : ''}
                size="sm"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setQrItem(null)}>
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() =>
                                qrItem && void downloadQRCode(qrPayload(qrItem), `QR_${qrItem.serialNumber}`)
                            }
                        >
                            Download PNG
                        </button>
                    </>
                }
            >
                {qrItem && (
                    <div className="stack">
                        <QRCode value={qrPayload(qrItem)} label={`QR code for ${qrItem.itemName}`} />
                        <div className="info-list">
                            {[
                                ['QR code ID', qrItem.qrCodeId],
                                ['Serial', qrItem.serialNumber],
                                ['Category', qrItem.category],
                                ['Daily rate', currency(qrItem.baseRentalPrice)],
                                ['Status', qrItem.status],
                            ].map(([label, value]) => (
                                <div key={label} className="info-list__row">
                                    <span className="info-list__label">{label}</span>
                                    <span className="info-list__value">{value}</span>
                                </div>
                            ))}
                        </div>
                        <p className="faint text-sm">
                            Scanning this code looks the item up on the server — the label itself carries no pricing
                            or customer data.
                        </p>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!toArchive}
                onClose={() => setToArchive(null)}
                onConfirm={() =>
                    runAction(
                        () => inventoryAPI.archive(toArchive!._id),
                        `${toArchive!.itemName} archived`,
                        () => setToArchive(null)
                    )
                }
                title="Archive item"
                message={`Archive "${toArchive?.itemName}"? It will be hidden from the active list but kept in records, and can be restored later.`}
                confirmLabel="Archive"
                tone="primary"
            />

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() =>
                    runAction(
                        () => inventoryAPI.remove(toDelete!._id),
                        `${toDelete!.itemName} deleted`,
                        () => setToDelete(null)
                    )
                }
                title="Delete item permanently"
                message={`Permanently delete "${toDelete?.itemName}"? This cannot be undone. Items that appear on past rentals cannot be deleted — archive them instead.`}
                confirmLabel="Delete permanently"
            />
        </>
    );
};

export default InventoryPage;
