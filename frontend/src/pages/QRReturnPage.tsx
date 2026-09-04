import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { rentalsAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import QRScanner from '../components/QRScanner';
import { EmptyState, Field, StatusBadge } from '../components/ui';
import { currency, formatDate, toDateInput } from '../utils/format';
import type { Rental } from '../types/api';

type Stage = 'scan' | 'review' | 'done';

interface DamageEntry {
    itemId: string;
    damaged: boolean;
    charge: string;
    note: string;
}

const today = () => toDateInput(new Date());

const daysLate = (dueDate: string, returnDate: string) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const ret = new Date(returnDate);
    ret.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((ret.getTime() - due.getTime()) / 86_400_000));
};

const QRReturnPage = () => {
    const [stage, setStage] = useState<Stage>('scan');
    const [rental, setRental] = useState<Rental | null>(null);
    const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);
    const [looking, setLooking] = useState(false);

    const [returnDate, setReturnDate] = useState(today());
    const [damages, setDamages] = useState<DamageEntry[]>([]);
    const [lateFeeOverride, setLateFeeOverride] = useState<string>('');
    const [useOverride, setUseOverride] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<Rental | null>(null);

    const dailyRateTotal = useMemo(
        () => (rental ? rental.items.reduce((sum, i) => sum + i.dailyRate * i.quantity, 0) : 0),
        [rental]
    );
    const computedLateDays = rental ? daysLate(rental.dueDate, returnDate) : 0;
    const computedLateFee = computedLateDays * dailyRateTotal;
    const effectiveLateFee = useOverride ? Number(lateFeeOverride) || 0 : computedLateFee;
    const damageTotal = damages.filter(d => d.damaged).reduce((sum, d) => sum + (Number(d.charge) || 0), 0);
    const projectedTotal = (rental?.baseAmount ?? 0) + effectiveLateFee + damageTotal;

    const handleScan = async (qrCodeId: string) => {
        setLooking(true);
        setNotFoundMessage(null);
        try {
            const found = await rentalsAPI.getByQR(qrCodeId);
            setRental(found);
            setReturnDate(today());
            setDamages(
                found.items.map(i => ({
                    itemId: typeof i.itemId === 'string' ? i.itemId : i.itemId._id,
                    damaged: false,
                    charge: '',
                    note: '',
                }))
            );
            setLateFeeOverride('');
            setUseOverride(false);
            setPaymentStatus('Paid');
            setNotes('');
            setStage('review');
        } catch (err) {
            setNotFoundMessage(
                err instanceof ApiError
                    ? err.message
                    : errorMessage(err)
            );
        } finally {
            setLooking(false);
        }
    };

    // Escape hatch back to scanning without losing entered data by accident.
    useEffect(() => {
        if (stage === 'scan') {
            setRental(null);
            setNotFoundMessage(null);
        }
    }, [stage]);

    const updateDamage = (itemId: string, patch: Partial<DamageEntry>) =>
        setDamages(prev => prev.map(d => (d.itemId === itemId ? { ...d, ...patch } : d)));

    const handleSubmit = async () => {
        if (!rental) return;
        setSaving(true);
        try {
            const returned = await rentalsAPI.processReturn({
                rentalId: rental._id,
                returnDate,
                damages: damages
                    .filter(d => d.damaged)
                    .map(d => ({ itemId: d.itemId, charge: Number(d.charge) || 0, note: d.note || undefined })),
                lateFeeOverride: useOverride ? Number(lateFeeOverride) || 0 : undefined,
                paymentStatus,
                notes: notes || undefined,
            });
            setResult(returned);
            setStage('done');
            toast.success(`${returned.rentalId} returned — ${currency(returned.totalAmount)}`);
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const startOver = () => {
        setStage('scan');
        setResult(null);
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>QR return</h1>
                    <p className="page-header__subtitle">Scan an item to process its rental return.</p>
                </div>
                {stage !== 'scan' && (
                    <button type="button" className="btn" onClick={startOver}>
                        ← Scan another
                    </button>
                )}
            </div>

            {stage === 'scan' && (
                <div className="card" style={{ maxWidth: 520 }}>
                    {notFoundMessage && (
                        <div className="alert alert--warning mb-4" role="alert">
                            {notFoundMessage}
                        </div>
                    )}
                    {looking ? (
                        <div className="stack" aria-busy="true">
                            <span className="spinner" aria-hidden="true" /> Looking up rental…
                        </div>
                    ) : (
                        <QRScanner onScan={handleScan} />
                    )}
                </div>
            )}

            {stage === 'review' && rental && (
                <div className="stack">
                    <div className="card">
                        <div className="row row--between">
                            <div>
                                <h2>{rental.rentalId}</h2>
                                <p className="muted">
                                    {rental.customer.firstName} {rental.customer.lastName} · {rental.customer.phone}
                                </p>
                            </div>
                            <StatusBadge status={rental.status} />
                        </div>
                        <div className="info-list mt-4">
                            <div className="info-list__row">
                                <span className="info-list__label">Rented</span>
                                <span className="info-list__value">{formatDate(rental.rentalDate)}</span>
                            </div>
                            <div className="info-list__row">
                                <span className="info-list__label">Due</span>
                                <span className="info-list__value">{formatDate(rental.dueDate)}</span>
                            </div>
                            <div className="info-list__row">
                                <span className="info-list__label">Base amount</span>
                                <span className="info-list__value">{currency(rental.baseAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-4">Items and damage</h3>
                        <div className="table-wrap">
                            <table className="table table--stack">
                                <thead>
                                    <tr>
                                        <th scope="col">Item</th>
                                        <th scope="col">Damaged?</th>
                                        <th scope="col">Charge (Rs.)</th>
                                        <th scope="col">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rental.items.map(item => {
                                        const info = typeof item.itemId === 'string' ? null : item.itemId;
                                        const entry = damages.find(
                                            d => d.itemId === (info ? info._id : String(item.itemId))
                                        );
                                        if (!entry) return null;
                                        return (
                                            <tr key={entry.itemId}>
                                                <td data-label="Item">
                                                    <strong>{info?.itemName ?? 'Item'}</strong>
                                                    <div className="faint text-sm mono">{info?.serialNumber}</div>
                                                </td>
                                                <td data-label="Damaged?">
                                                    <label className="row" style={{ gap: 6 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={entry.damaged}
                                                            onChange={e =>
                                                                updateDamage(entry.itemId, { damaged: e.target.checked })
                                                            }
                                                        />
                                                        <span className="sr-only">Mark {info?.itemName} as damaged</span>
                                                    </label>
                                                </td>
                                                <td data-label="Charge">
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        style={{ width: 120 }}
                                                        value={entry.charge}
                                                        disabled={!entry.damaged}
                                                        onChange={e => updateDamage(entry.itemId, { charge: e.target.value })}
                                                        aria-label={`Damage charge for ${info?.itemName}`}
                                                    />
                                                </td>
                                                <td data-label="Note">
                                                    <input
                                                        className="input"
                                                        value={entry.note}
                                                        disabled={!entry.damaged}
                                                        onChange={e => updateDamage(entry.itemId, { note: e.target.value })}
                                                        placeholder="e.g. cracked casing"
                                                        aria-label={`Damage note for ${info?.itemName}`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="form-grid">
                            <Field label="Return date" htmlFor="returnDate" required>
                                <input
                                    id="returnDate"
                                    className="input"
                                    type="date"
                                    value={returnDate}
                                    onChange={e => setReturnDate(e.target.value)}
                                    required
                                />
                            </Field>

                            <Field label="Payment status" htmlFor="paymentStatus">
                                <select
                                    id="paymentStatus"
                                    className="select"
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as typeof paymentStatus)}
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                </select>
                            </Field>
                        </div>

                        <div className="mt-4">
                            <label className="row" style={{ gap: 6 }}>
                                <input
                                    type="checkbox"
                                    checked={useOverride}
                                    onChange={e => setUseOverride(e.target.checked)}
                                />
                                <span>
                                    Override late fee (calculated: {currency(computedLateFee)} for {computedLateDays} day
                                    {computedLateDays === 1 ? '' : 's'})
                                </span>
                            </label>
                            {useOverride && (
                                <input
                                    className="input mt-4"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    style={{ maxWidth: 200 }}
                                    value={lateFeeOverride}
                                    onChange={e => setLateFeeOverride(e.target.value)}
                                    aria-label="Override late fee amount"
                                />
                            )}
                        </div>

                        <div className="mt-4">
                            <Field label="Notes" htmlFor="return-notes">
                                <textarea
                                    id="return-notes"
                                    className="textarea"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="card" aria-live="polite">
                        <div className="row row--between">
                            <span className="muted">Base amount</span>
                            <span className="num">{currency(rental.baseAmount)}</span>
                        </div>
                        <div className="row row--between">
                            <span className="muted">Late fee</span>
                            <span className="num">{currency(effectiveLateFee)}</span>
                        </div>
                        <div className="row row--between">
                            <span className="muted">Damage charges</span>
                            <span className="num">{currency(damageTotal)}</span>
                        </div>
                        <div className="row row--between mt-4">
                            <strong>Total due</strong>
                            <span className="stat__value">{currency(projectedTotal)}</span>
                        </div>
                    </div>

                    <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn" onClick={startOver} disabled={saving}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            Complete return
                        </button>
                    </div>
                </div>
            )}

            {stage === 'done' && result && (
                <div className="card" style={{ maxWidth: 520 }}>
                    <div className="row row--between">
                        <h2>Return complete</h2>
                        <StatusBadge status={result.status} />
                    </div>
                    <p className="muted mt-4">{result.rentalId} has been returned.</p>
                    <div className="info-list mt-4">
                        <div className="info-list__row">
                            <span className="info-list__label">Late fee</span>
                            <span className="info-list__value">{currency(result.lateFee)}</span>
                        </div>
                        <div className="info-list__row">
                            <span className="info-list__label">Damage charges</span>
                            <span className="info-list__value">{currency(result.damageCharges)}</span>
                        </div>
                        <div className="info-list__row">
                            <span className="info-list__label">Total charged</span>
                            <span className="info-list__value">{currency(result.totalAmount)}</span>
                        </div>
                        <div className="info-list__row">
                            <span className="info-list__label">Payment status</span>
                            <span className="info-list__value">{result.paymentStatus}</span>
                        </div>
                    </div>
                    <button type="button" className="btn btn--primary btn--block mt-5" onClick={startOver}>
                        Process another return
                    </button>
                </div>
            )}

            {stage === 'review' && !rental && (
                <EmptyState icon="↩️" title="Nothing to review" hint="Scan an item to start a return." />
            )}
        </>
    );
};

export default QRReturnPage;
