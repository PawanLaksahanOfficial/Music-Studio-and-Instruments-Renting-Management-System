import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { customersAPI, invoicesAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, ErrorState, Field, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { BillableForCustomer, Customer, Invoice } from '../types/api';

interface ManualLine {
    description: string;
    quantity: string;
    unitPrice: string;
}

const EMPTY_LINE: ManualLine = { description: '', quantity: '1', unitPrice: '' };

const InvoiceManager = () => {
    const query = usePagedQuery<Invoice>(params => invoicesAPI.getAll(params));

    const [createOpen, setCreateOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [billable, setBillable] = useState<BillableForCustomer | null>(null);
    const [loadingBillable, setLoadingBillable] = useState(false);
    const [productIds, setProductIds] = useState<string[]>([]);
    const [studioIds, setStudioIds] = useState<string[]>([]);
    const [manualLines, setManualLines] = useState<ManualLine[]>([]);
    const [taxRate, setTaxRate] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Pending');
    const [notes, setNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [viewing, setViewing] = useState<Invoice | null>(null);
    const [toMarkPaid, setToMarkPaid] = useState<Invoice | null>(null);

    const openCreate = async () => {
        setCustomerId('');
        setBillable(null);
        setProductIds([]);
        setStudioIds([]);
        setManualLines([]);
        setTaxRate('0');
        setPaymentMethod('Cash');
        setPaymentStatus('Pending');
        setNotes('');
        setFieldErrors({});
        setCreateOpen(true);
        try {
            const page = await customersAPI.getAll({ limit: 200 });
            setCustomers(page.data);
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    // Only rentals not already on an invoice are offered, so nothing is billed twice.
    useEffect(() => {
        if (!customerId) {
            setBillable(null);
            return;
        }
        let active = true;
        setLoadingBillable(true);
        setProductIds([]);
        setStudioIds([]);
        invoicesAPI
            .getBillable(customerId)
            .then(result => {
                if (active) setBillable(result);
            })
            .catch(err => {
                if (active) toast.error(errorMessage(err));
            })
            .finally(() => {
                if (active) setLoadingBillable(false);
            });
        return () => {
            active = false;
        };
    }, [customerId]);

    // Preview only — the server recomputes every figure from its own records.
    const previewSubtotal =
        (billable?.productRentals ?? [])
            .filter(r => productIds.includes(r._id))
            .reduce((sum, r) => sum + r.totalAmount, 0) +
        (billable?.studioRentals ?? [])
            .filter(r => studioIds.includes(r._id))
            .reduce((sum, r) => sum + r.totalAmount, 0) +
        manualLines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
    const previewTax = previewSubtotal * ((Number(taxRate) || 0) / 100);

    const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
        setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});
        try {
            const invoice = await invoicesAPI.create({
                customerId,
                productRentalIds: productIds,
                studioRentalIds: studioIds,
                manualItems: manualLines
                    .filter(l => l.description.trim())
                    .map(l => ({
                        description: l.description,
                        quantity: Number(l.quantity) || 1,
                        unitPrice: Number(l.unitPrice) || 0,
                    })),
                taxRate: Number(taxRate) || 0,
                paymentMethod,
                paymentStatus,
                notes: notes || undefined,
            });
            toast.success(`Invoice ${invoice.invoiceId} created — ${currency(invoice.totalAmount)}`);
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

    const markPaid = async () => {
        try {
            await invoicesAPI.updatePayment(toMarkPaid!._id, 'Paid');
            toast.success('Invoice marked paid — linked rentals updated');
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setToMarkPaid(null);
        }
    };

    const nothingSelected = productIds.length === 0 && studioIds.length === 0 && manualLines.length === 0;

    return (
        <>
            <PageHeader
                title="Invoices"
                subtitle={query.meta ? `${query.meta.total} invoices` : 'Loading…'}
                actions={
                    <button type="button" className="btn btn--primary" onClick={() => void openCreate()}>
                        + New invoice
                    </button>
                }
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="invoice-search">
                    Search invoices
                </label>
                <input
                    id="invoice-search"
                    className="input"
                    type="search"
                    placeholder="Search by invoice ID…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
                <label className="sr-only" htmlFor="invoice-payment">
                    Filter by payment status
                </label>
                <select
                    id="invoice-payment"
                    className="select"
                    value={query.filters.paymentStatus ?? 'All'}
                    onChange={e => query.setFilter('paymentStatus', e.target.value)}
                >
                    <option value="All">All statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                </select>
            </div>

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={6} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState icon="🧾" title="No invoices found" hint="Create an invoice from a customer's rentals." />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Invoice</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Date</th>
                                <th scope="col">Method</th>
                                <th scope="col" className="table__num">
                                    Total
                                </th>
                                <th scope="col">Status</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(invoice => (
                                <tr key={invoice._id}>
                                    <td data-label="Invoice" className="table__mono">
                                        {invoice.invoiceId}
                                    </td>
                                    <td data-label="Customer">
                                        {invoice.customer
                                            ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                                            : '—'}
                                    </td>
                                    <td data-label="Date">{formatDate(invoice.createdAt)}</td>
                                    <td data-label="Method">{invoice.paymentMethod}</td>
                                    <td data-label="Total" className="table__num">
                                        {currency(invoice.totalAmount)}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={invoice.paymentStatus} />
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            <button type="button" className="btn btn--sm" onClick={() => setViewing(invoice)}>
                                                View
                                            </button>
                                            {invoice.paymentStatus === 'Pending' && (
                                                <button
                                                    type="button"
                                                    className="btn btn--sm btn--primary"
                                                    onClick={() => setToMarkPaid(invoice)}
                                                >
                                                    Mark paid
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

            {/* ─── Create ─── */}
            <Modal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                title="New invoice"
                size="lg"
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setCreateOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="invoice-form"
                            className="btn btn--primary"
                            disabled={saving || !customerId || nothingSelected}
                        >
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Create invoice
                        </button>
                    </>
                }
            >
                <form id="invoice-form" onSubmit={handleCreate} className="stack">
                    <div className="form-grid">
                        <Field label="Customer" htmlFor="inv-customer" required error={fieldErrors.customerId}>
                            <select
                                id="inv-customer"
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

                        <Field label="Payment method" htmlFor="inv-method" required error={fieldErrors.paymentMethod}>
                            <select
                                id="inv-method"
                                className="select"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Transfer">Transfer</option>
                            </select>
                        </Field>

                        <Field label="Tax rate (%)" htmlFor="inv-tax" error={fieldErrors.taxRate}>
                            <input
                                id="inv-tax"
                                className="input"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={taxRate}
                                onChange={e => setTaxRate(e.target.value)}
                            />
                        </Field>

                        <Field label="Payment status" htmlFor="inv-status" error={fieldErrors.paymentStatus}>
                            <select
                                id="inv-status"
                                className="select"
                                value={paymentStatus}
                                onChange={e => setPaymentStatus(e.target.value)}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </Field>
                    </div>

                    {customerId && (
                        <>
                            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                                <legend className="field__label">Unbilled rentals</legend>
                                {loadingBillable ? (
                                    <div className="skeleton mt-4" style={{ height: 80 }} />
                                ) : (billable?.productRentals.length ?? 0) + (billable?.studioRentals.length ?? 0) === 0 ? (
                                    <p className="muted text-sm mt-4">
                                        Nothing unbilled for this customer. Add manual lines below.
                                    </p>
                                ) : (
                                    <div
                                        className="stack mt-4"
                                        style={{
                                            gap: 0,
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            border: '1px solid var(--c-border)',
                                            borderRadius: 'var(--r-md)',
                                        }}
                                    >
                                        {billable?.productRentals.map(r => (
                                            <label
                                                key={r._id}
                                                className="row"
                                                style={{
                                                    padding: 'var(--sp-2) var(--sp-3)',
                                                    borderBottom: '1px solid var(--c-border)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={productIds.includes(r._id)}
                                                    onChange={() => toggle(productIds, setProductIds, r._id)}
                                                />
                                                <span className="grow">
                                                    <span className="mono">{r.rentalId}</span>{' '}
                                                    <span className="faint text-sm">
                                                        rental · due {formatDate(r.dueDate)}
                                                    </span>
                                                </span>
                                                <span className="num">{currency(r.totalAmount)}</span>
                                            </label>
                                        ))}
                                        {billable?.studioRentals.map(r => (
                                            <label
                                                key={r._id}
                                                className="row"
                                                style={{
                                                    padding: 'var(--sp-2) var(--sp-3)',
                                                    borderBottom: '1px solid var(--c-border)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={studioIds.includes(r._id)}
                                                    onChange={() => toggle(studioIds, setStudioIds, r._id)}
                                                />
                                                <span className="grow">
                                                    <span className="mono">{r.bookingId}</span>{' '}
                                                    <span className="faint text-sm">studio · {r.roomName}</span>
                                                </span>
                                                <span className="num">{currency(r.totalAmount)}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </fieldset>

                            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                                <legend className="field__label">Additional charges</legend>
                                <div className="stack mt-4">
                                    {manualLines.map((line, idx) => (
                                        <div key={idx} className="row row--wrap">
                                            <input
                                                className="input grow"
                                                placeholder="Description"
                                                aria-label={`Line ${idx + 1} description`}
                                                value={line.description}
                                                onChange={e => {
                                                    const next = [...manualLines];
                                                    next[idx] = { ...line, description: e.target.value };
                                                    setManualLines(next);
                                                }}
                                            />
                                            <input
                                                className="input"
                                                type="number"
                                                min={1}
                                                style={{ width: 90 }}
                                                aria-label={`Line ${idx + 1} quantity`}
                                                value={line.quantity}
                                                onChange={e => {
                                                    const next = [...manualLines];
                                                    next[idx] = { ...line, quantity: e.target.value };
                                                    setManualLines(next);
                                                }}
                                            />
                                            <input
                                                className="input"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                style={{ width: 130 }}
                                                placeholder="Unit price"
                                                aria-label={`Line ${idx + 1} unit price`}
                                                value={line.unitPrice}
                                                onChange={e => {
                                                    const next = [...manualLines];
                                                    next[idx] = { ...line, unitPrice: e.target.value };
                                                    setManualLines(next);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn--sm btn--ghost"
                                                onClick={() => setManualLines(manualLines.filter((_, i) => i !== idx))}
                                                aria-label={`Remove line ${idx + 1}`}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn--sm"
                                        onClick={() => setManualLines([...manualLines, { ...EMPTY_LINE }])}
                                    >
                                        + Add line
                                    </button>
                                </div>
                            </fieldset>
                        </>
                    )}

                    <Field label="Notes" htmlFor="inv-notes" error={fieldErrors.notes}>
                        <textarea
                            id="inv-notes"
                            className="textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </Field>

                    <div className="card" aria-live="polite">
                        <div className="row row--between">
                            <span className="muted">Subtotal</span>
                            <span className="num">{currency(previewSubtotal)}</span>
                        </div>
                        <div className="row row--between">
                            <span className="muted">Tax ({taxRate || 0}%)</span>
                            <span className="num">{currency(previewTax)}</span>
                        </div>
                        <div className="row row--between mt-4">
                            <strong>Total</strong>
                            <span className="stat__value">{currency(previewSubtotal + previewTax)}</span>
                        </div>
                        <p className="faint text-sm mt-4">
                            Preview only. The server recalculates every figure from its own records when the invoice
                            is saved.
                        </p>
                    </div>
                </form>
            </Modal>

            {/* ─── View / print ─── */}
            <Modal
                isOpen={!!viewing}
                onClose={() => setViewing(null)}
                title={viewing ? `Invoice ${viewing.invoiceId}` : ''}
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setViewing(null)}>
                            Close
                        </button>
                        <button type="button" className="btn btn--primary no-print" onClick={() => window.print()}>
                            Print
                        </button>
                    </>
                }
            >
                {viewing && (
                    <div className="stack">
                        <div className="info-list">
                            <div className="info-list__row">
                                <span className="info-list__label">Customer</span>
                                <span className="info-list__value">
                                    {viewing.customer?.firstName} {viewing.customer?.lastName}
                                </span>
                            </div>
                            <div className="info-list__row">
                                <span className="info-list__label">Issued</span>
                                <span className="info-list__value">{formatDate(viewing.createdAt)}</span>
                            </div>
                            <div className="info-list__row">
                                <span className="info-list__label">Method</span>
                                <span className="info-list__value">{viewing.paymentMethod}</span>
                            </div>
                            <div className="info-list__row">
                                <span className="info-list__label">Issued by</span>
                                <span className="info-list__value">{viewing.createdBy?.name ?? '—'}</span>
                            </div>
                        </div>

                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Description</th>
                                        <th scope="col" className="table__num">
                                            Qty
                                        </th>
                                        <th scope="col" className="table__num">
                                            Unit
                                        </th>
                                        <th scope="col" className="table__num">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewing.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                {item.description}
                                                <div className="faint text-sm">{item.sourceType}</div>
                                            </td>
                                            <td className="table__num">{item.quantity}</td>
                                            <td className="table__num">{currency(item.unitPrice)}</td>
                                            <td className="table__num">{currency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="card">
                            <div className="row row--between">
                                <span className="muted">Subtotal</span>
                                <span className="num">{currency(viewing.subtotal)}</span>
                            </div>
                            <div className="row row--between">
                                <span className="muted">Tax ({viewing.taxRate}%)</span>
                                <span className="num">{currency(viewing.tax)}</span>
                            </div>
                            <div className="row row--between mt-4">
                                <strong>Total</strong>
                                <span className="stat__value">{currency(viewing.totalAmount)}</span>
                            </div>
                        </div>

                        {viewing.notes && <p className="muted">{viewing.notes}</p>}
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!toMarkPaid}
                onClose={() => setToMarkPaid(null)}
                onConfirm={markPaid}
                title="Mark invoice paid"
                message={`Record ${toMarkPaid?.invoiceId} (${currency(toMarkPaid?.totalAmount ?? 0)}) as paid? Every rental on this invoice is marked paid too.`}
                confirmLabel="Mark paid"
                tone="primary"
            />
        </>
    );
};

export default InvoiceManager;
