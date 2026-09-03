import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalsAPI } from '../services/api';
import QRScanner from '../components/QRScanner';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../styles/AllStyles';
import { QRReturnPageStyles as s } from '../styles/QRReturnPageStyles';

type Stage = 'idle' | 'scanning' | 'found' | 'not_found' | 'not_rented' | 'review' | 'done';
type PayMethod = 'Cash' | 'Card' | 'Transfer';
type PayStatus = 'Paid' | 'Pending' | 'Partial';

interface RentalData {
    _id: string;
    rentalId: string;
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
        nicOrPassport?: string;
    };
    items: Array<{
        itemId: {
            _id: string;
            itemName: string;
            serialNumber: string;
            brand?: string;
            itemModel?: string;
            baseRentalPrice: number;
            purchaseDate?: string;
        };
        quantity: number;
    }>;
    rentalDate: string;
    dueDate: string;
    returnDate?: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
    notes?: string;
}

interface ReturnResult {
    _id: string;
    rentalId: string;
    customer: { firstName: string; lastName: string; phone: string };
    items: Array<{ itemId: { itemName: string; serialNumber: string; brand?: string } }>;
    rentalDate: string;
    dueDate: string;
    returnDate: string;
    status: string;
    totalAmount: number;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    paymentStatus: string;
}

const today = () => new Date().toISOString().split('T')[0];

const daysBetween = (a: string, b: string) => {
    if (!a || !b) return 0;
    return Math.max(0, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
};

const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currency = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const QRReturnPage: React.FC = () => {
    const navigate = useNavigate();
    const [stage, setStage] = useState<Stage>('idle');
    const [scannedId, setScannedId] = useState('');
    const [rental, setRental] = useState<RentalData | null>(null);
    const [errMsg, setErrMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<ReturnResult | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [returnDate, setReturnDate] = useState(today());
    const [lateFee, setLateFee] = useState(0);
    const [damageCharges, setDamageCharges] = useState(0);
    const [damageNotes, setDamageNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PayMethod>('Cash');
    const [paymentStatus, setPaymentStatus] = useState<PayStatus>('Pending');

    // Auto calculate late fee when dates change
    useEffect(() => {
        if (rental && returnDate) {
            const due = new Date(rental.dueDate);
            const ret = new Date(returnDate);
            if (ret > due) {
                const lateDays = daysBetween(rental.dueDate, returnDate);
                const dailyRate = rental.items[0]?.itemId?.baseRentalPrice || 0;
                setLateFee(lateDays * dailyRate);
            } else {
                setLateFee(0);
            }
        }
    }, [rental, returnDate]);

    const handleScan = async (qrCodeId: string) => {
        setScannedId(qrCodeId);
        setErrMsg('');
        setStage('idle');
        try {
            const res = await rentalsAPI.getByQR(qrCodeId);
            const found: RentalData = res.data;
            setRental(found);
            setReturnDate(today());
            setLateFee(0);
            setDamageCharges(0);
            setDamageNotes('');
            setPaymentMethod('Cash');
            setPaymentStatus('Pending');
            setStage('found');
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                const msg = err?.response?.data?.message || '';
                setStage(msg.includes('No inventory') ? 'not_found' : 'not_rented');
            } else {
                setErrMsg('Server error. Check connection.');
                setStage('idle');
            }
        }
    };

    const handleProcessReturn = async () => {
        if (!rental || !returnDate) return;
        setSaving(true);
        setErrMsg('');
        try {
            const res = await rentalsAPI.processReturn({
                rentalId: rental._id,
                returnDate,
                lateFee,
                damageCharges,
                damageNotes,
                paymentStatus,
                paymentMethod,
            });
            setResult(res.data);
            setStage('done');
        } catch (err: any) {
            setErrMsg(err?.response?.data?.message || 'Failed to process return. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><title>Return Receipt ${result?.rentalId ?? ''}</title>
        <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:'Segoe UI',Arial,sans-serif;padding:36px;color:#1e293b;font-size:14px}
            .logo{font-size:22px;font-weight:800;color:#2563eb}
            .meta{font-size:12px;color:#64748b;margin-top:3px}
            .divider{border:none;border-top:2px solid #e2e8f0;margin:18px 0}
            .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}
            .lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
            .val{font-size:14px;font-weight:600;color:#1e293b}
            table{width:100%;border-collapse:collapse;margin:16px 0}
            th{background:#f8fafc;padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;border:1px solid #e2e8f0}
            td{padding:10px 12px;border:1px solid #e2e8f0;font-size:13px}
            .total-row td{background:#eff6ff;font-weight:800;font-size:15px;color:#2563eb}
            .footer{margin-top:28px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
        </style></head><body>${content.innerHTML}</body></html>`);
        w.document.close();
        w.print();
    };

    const reset = () => {
        setStage('idle');
        setRental(null);
        setScannedId('');
        setErrMsg('');
        setResult(null);
        setSaving(false);
        setReturnDate(today());
        setLateFee(0);
        setDamageCharges(0);
        setDamageNotes('');
        setPaymentMethod('Cash');
        setPaymentStatus('Pending');
    };

    const originalTotal = rental?.totalAmount || 0;
    const grandTotal = originalTotal + lateFee + damageCharges;
    const lateDays = rental ? daysBetween(rental.dueDate, returnDate) : 0;

    return (
        <div style={s.container}>
            <div style={s.pageHeader}>
                <div>
                    <h2 style={s.pageTitle}>⬅️ QR Scan → Return Instrument</h2>
                    <p style={s.pageSub}>
                        Scan an instrument's QR code to process its return, calculate late fees, and update inventory
                    </p>
                </div>
                <button onClick={() => navigate('/admin/products')} style={s.ghostBtn}>
                    View Rentals
                </button>
            </div>
            {stage === 'idle' && (
                <div style={s.card}>
                    <div style={s.cardCentered}>
                        <div style={s.iconLarge}>📥</div>
                        <h3 style={s.idleTitle}>Scan QR to Return</h3>
                        <p style={s.idleText}>
                            When a client returns an instrument, scan its QR code to auto-retrieve rental details,
                            calculate late fees/damage charges, and mark it as returned.
                        </p>
                        {errMsg && <p style={{ ...s.err, marginBottom: 16 }}>{errMsg}</p>}
                        <button onClick={() => setStage('scanning')} style={s.primaryBtn}>
                            📷 Open Webcam Scanner
                        </button>
                        <p style={s.tipText}>
                            💡 Point your webcam at the instrument's QR code sticker or digital QR on screen
                        </p>
                    </div>
                </div>
            )}
            {stage === 'not_found' && (
                <div style={s.card}>
                    <div style={s.cardCentered}>
                        <div style={s.iconLarge}>❓</div>
                        <h3 style={s.notFoundTitle}>QR Code Not Recognised</h3>
                        <p style={s.notFoundText}>No inventory item matched:</p>
                        <code style={s.code}>{scannedId}</code>
                        <div style={s.btnRow}>
                            <button onClick={() => setStage('scanning')} style={s.primaryBtn}>Scan Again</button>
                            <button onClick={reset} style={s.ghostBtn}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
            {stage === 'not_rented' && (
                <div style={s.card}>
                    <div style={s.notRentedPadding}>
                        <div style={s.iconLarge}>🟢</div>
                        <h3 style={s.notFoundTitle}>Instrument is Not Currently Rented</h3>
                        <p style={s.notRentedText}>
                            This instrument has no active rental record. It may already be available.
                        </p>
                        <div style={s.btnRow}>
                            <button onClick={() => setStage('scanning')} style={s.primaryBtn}>Scan Another</button>
                            <button onClick={reset} style={s.ghostBtn}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
            {stage === 'found' && rental && (
                <div style={s.card}>
                    <div style={s.stepLabel}>✅ Active Rental Found</div>
                    <div style={s.infoBox}>
                        <div style={s.detailGrid}>
                            <div>
                                <div style={s.label}>Instrument</div>
                                <div style={s.value}>{rental.items[0]?.itemId?.itemName || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={s.label}>Serial Number</div>
                                <div style={s.value}>{rental.items[0]?.itemId?.serialNumber || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={s.label}>Brand / Model</div>
                                <div style={s.value}>
                                    {[rental.items[0]?.itemId?.brand, rental.items[0]?.itemId?.itemModel].filter(Boolean).join(' / ') || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style={s.label}>Rental ID</div>
                                <div style={s.value}>{rental.rentalId}</div>
                            </div>
                            <div>
                                <div style={s.label}>Customer</div>
                                <div style={s.value}>
                                    {rental.customer.firstName} {rental.customer.lastName}
                                </div>
                            </div>
                            <div>
                                <div style={s.label}>Phone</div>
                                <div style={s.value}>{rental.customer.phone}</div>
                            </div>
                        </div>
                    </div>
                    <div style={s.infoBox}>
                        <div style={s.periodGrid}>
                            <div>
                                <div style={s.label}>Rental Date</div>
                                <div style={s.value}>{fmtDate(rental.rentalDate)}</div>
                            </div>
                            <div>
                                <div style={s.label}>Due Date</div>
                                <div style={s.value}>{fmtDate(rental.dueDate)}</div>
                            </div>
                            <div>
                                <div style={s.label}>Original Amount</div>
                                <div style={s.value}>{currency(rental.totalAmount)}</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 20 }}>
                        <h4 style={s.sectionTitle}>Process Return</h4>
                        <p style={s.sectionSub}>
                            Fill in the return details below. Late fees are auto-calculated.
                        </p>

                        <div style={s.formGrid}>
                            <div>
                                <label style={s.label}>Return Date *</label>
                                <input
                                    type="date"
                                    style={s.input}
                                    value={returnDate}
                                    max={today()}
                                    onChange={e => setReturnDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={s.label}>Payment Method</label>
                                <select
                                    style={s.select}
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as PayMethod)}
                                >
                                    <option>Cash</option>
                                    <option>Card</option>
                                    <option>Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Payment Status</label>
                                <select
                                    style={s.select}
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value as PayStatus)}
                                >
                                    <option>Pending</option>
                                    <option>Paid</option>
                                    <option>Partial</option>
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>Original Rental Amount</label>
                                <div style={{ ...s.input, ...s.inputDisabled }}>
                                    {currency(originalTotal)}
                                </div>
                            </div>
                        </div>
                        {lateFee > 0 && (
                            <div style={s.warningBox}>
                                <div style={s.warningTitle}>⏰ Late Return Detected</div>
                                <div style={s.row}>
                                    <span>Late by {lateDays} day{lateDays > 1 ? 's' : ''} × Rs. {rental.items[0]?.itemId?.baseRentalPrice || 0}/day</span>
                                    <strong style={s.lateFeeText}>+ {currency(lateFee)}</strong>
                                </div>
                                <label style={{ ...s.label, marginBottom: 4, marginTop: 8 }}>Late Fee (adjustable)</label>
                                <input
                                    type="number"
                                    min={0}
                                    style={s.narrowInput}
                                    value={lateFee}
                                    onChange={e => setLateFee(Number(e.target.value))}
                                />
                            </div>
                        )}
                        <div style={s.infoBox}>
                            <div style={s.infoTitle}>🔧 Damage Assessment</div>
                            <div style={s.formGrid}>
                                <div>
                                    <label style={s.label}>Damage Charge (Rs.)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        style={s.input}
                                        value={damageCharges === 0 ? '' : damageCharges}
                                        placeholder="0"
                                        onChange={e => setDamageCharges(e.target.value === '' ? 0 : Number(e.target.value))}
                                    />
                                </div>
                                <div style={s.fullWidth}>
                                    <label style={s.label}>Damage Notes</label>
                                    <textarea
                                        style={s.textarea}
                                        value={damageNotes}
                                        placeholder="Describe any damage to the instrument (optional)"
                                        onChange={e => setDamageNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={s.costBox}>
                            <div style={s.costTitle}>💰 Final Bill Summary</div>
                            <div style={s.row}>
                                <span>Original Rental Amount</span>
                                <strong>{currency(originalTotal)}</strong>
                            </div>
                            {lateFee > 0 && (
                                <div style={s.row}>
                                    <span>Late Fee</span>
                                    <strong style={s.lateFeeText}>+ {currency(lateFee)}</strong>
                                </div>
                            )}
                            {damageCharges > 0 && (
                                <div style={s.row}>
                                    <span>Damage Charges</span>
                                    <strong style={s.damageText}>+ {currency(damageCharges)}</strong>
                                </div>
                            )}
                            <div style={s.totalRow}>
                                <span>Total to Pay</span>
                                <span>{currency(grandTotal)}</span>
                            </div>
                        </div>
                        {errMsg && <p style={{ ...s.err, ...s.errMargin }}>{errMsg}</p>}
                        <div style={s.btnRow}>
                            <button
                                onClick={handleProcessReturn}
                                style={s.primaryBtn}
                                disabled={saving || !returnDate}
                            >
                                {saving ? 'Processing…' : '✅ Mark as Returned'}
                            </button>
                            <button onClick={() => setStage('scanning')} style={s.ghostBtn}>Scan Again</button>
                            <button onClick={reset} style={s.ghostBtn}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
            {stage === 'done' && result && (
                <div style={s.card}>
                    <div ref={printRef}>
                        <div style={s.stepLabel}>✅ Return Processed Successfully</div>
                        <div style={s.receiptHeader}>
                            <div>
                                <div style={s.printHeader}>🎵 ELVI Music Studio</div>
                                <div style={s.printMeta}>
                                    <strong>Rental:</strong> {result.rentalId}
                                </div>
                                <div style={s.printMeta}>
                                    <strong>Return Date:</strong> {fmtDate(result.returnDate)}
                                </div>
                            </div>
                            <div style={s.printCustomer}>
                                <div style={s.printCustomerName}>{result.customer.firstName} {result.customer.lastName}</div>
                                <div style={s.printCustomerDetail}>{result.customer.phone}</div>
                            </div>
                        </div>
                        <div style={s.successBox}>
                            <div style={s.detailGrid}>
                                <div>
                                    <div style={s.label}>Instrument</div>
                                    <div style={s.value}>{result.items[0]?.itemId?.itemName || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={s.label}>Serial No.</div>
                                    <div style={s.value}>{result.items[0]?.itemId?.serialNumber || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={s.label}>Rental Date</div>
                                    <div style={s.value}>{fmtDate(result.rentalDate)}</div>
                                </div>
                                <div>
                                    <div style={s.label}>Returned On</div>
                                    <div style={s.value}>{fmtDate(result.returnDate)}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <table style={s.printTable}>
                                <thead>
                                    <tr>
                                        <th style={s.printTh}>Description</th>
                                        <th style={s.printThRight}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={s.printTd}>Original Rental</td>
                                        <td style={s.printTdRight}>{currency(originalTotal)}</td>
                                    </tr>
                                    {result.lateFee > 0 && (
                                        <tr>
                                            <td style={{ ...s.printTd, color: '#dc2626' }}>Late Fee</td>
                                            <td style={{ ...s.printTdRight, color: '#dc2626' }}>+ {currency(result.lateFee)}</td>
                                        </tr>
                                    )}
                                    {result.damageCharges > 0 && (
                                        <tr>
                                            <td style={{ ...s.printTd, color: '#ea580c' }}>
                                                Damage Charges {result.damageNotes ? `(${result.damageNotes})` : ''}
                                            </td>
                                            <td style={{ ...s.printTdRight, color: '#ea580c' }}>+ {currency(result.damageCharges)}</td>
                                        </tr>
                                    )}
                                    <tr style={s.printTotalRow}>
                                        <td style={s.printTotalLabel}>TOTAL PAID</td>
                                        <td style={s.printTotalValue}>{currency(result.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={s.printFooterRow}>
                            <span>Payment: <strong>{result.paymentStatus}</strong></span>
                            <span>Method: <strong>{paymentMethod}</strong></span>
                        </div>

                        <div style={s.printFooter}>
                            Thank you for returning the instrument to ELVI Music Studio
                        </div>
                    </div>
                    {errMsg && <p style={{ ...s.err, ...s.errMargin }}>{errMsg}</p>}
                    <div style={s.btnRow}>
                        <button onClick={handlePrint} style={s.primaryBtn}>🖨 Print Receipt</button>
                        <button onClick={reset} style={s.ghostBtn}>📷 Return Another</button>
                        <button onClick={() => navigate('/admin/products')} style={s.ghostBtn}>View Rentals</button>
                    </div>
                </div>
            )}
            {stage === 'scanning' && (
                <QRScanner
                    onScanSuccess={handleScan}
                    onClose={() => setStage(rental ? 'found' : 'idle')}
                />
            )}
        </div>
    );
};

export default QRReturnPage;