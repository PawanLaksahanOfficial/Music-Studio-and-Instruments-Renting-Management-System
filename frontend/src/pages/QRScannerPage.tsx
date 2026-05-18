import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI, customersAPI, rentalsAPI, invoicesAPI } from '../services/api';
import QRScanner from '../components/QRScanner';
import Inventory from '../types/Inventory';
import Customer from '../types/Customer';
import { FormStyles, StatusBadge } from '../styles/AllStyles';

// ─── types ────────────────────────────────────────────────────────────────────
type Stage = 'idle' | 'scanning' | 'found' | 'unavailable' | 'not_found'
           | 'form' | 'preview' | 'done';

type PayMethod  = 'Cash' | 'Card' | 'Transfer';
type PayStatus  = 'Paid' | 'Pending';

interface RentalForm {
    customerId:    string;
    rentalDate:    string;
    returnDate:    string;
    paymentMethod: PayMethod;
    paymentStatus: PayStatus;
    tax:           number;
    notes:         string;
}

interface SavedResult {
    invoiceId:     string;
    rentalId:      string;
    customerName:  string;
    itemName:      string;
    days:          number;
    dailyRate:     number;
    subtotal:      number;
    tax:           number;
    total:         number;
    rentalDate:    string;
    returnDate:    string;
    paymentMethod: string;
    paymentStatus: string;
    serial:        string;
    notes:         string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const daysBetween = (a: string, b: string) => {
    if (!a || !b) return 0;
    return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const statusBadge = (s: string): React.CSSProperties => ({
    Available:   StatusBadge.available,
    Rented:      StatusBadge.rented,
    Maintenance: StatusBadge.maintenance,
    Damaged:     StatusBadge.damaged,
    Lost:        StatusBadge.lost,
}[s] ?? StatusBadge.lost);

// ─── component ────────────────────────────────────────────────────────────────
const QRScannerPage: React.FC = () => {
    const navigate = useNavigate();

    const [stage, setStage]           = useState<Stage>('idle');
    const [item, setItem]             = useState<Inventory | null>(null);
    const [customers, setCustomers]   = useState<Customer[]>([]);
    const [scannedId, setScannedId]   = useState('');
    const [errMsg, setErrMsg]         = useState('');
    const [saving, setSaving]         = useState(false);
    const [result, setResult]         = useState<SavedResult | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<RentalForm>({
        customerId: '', rentalDate: today(), returnDate: '',
        paymentMethod: 'Cash', paymentStatus: 'Pending', tax: 0, notes: '',
    });

    // live cost
    const days     = daysBetween(form.rentalDate, form.returnDate);
    const rate     = item?.baseRentalPrice ?? 0;
    const subtotal = days * rate;
    const total    = subtotal + Number(form.tax);

    // ── Step 1: QR scanned ──────────────────────────────────────────────────
    const handleScan = async (qrCodeId: string) => {
        setScannedId(qrCodeId);
        setErrMsg('');
        setStage('idle');  // close webcam modal first

        try {
            const res = await inventoryAPI.getByQR(qrCodeId);
            const found: Inventory = res.data;
            setItem(found);

            if (found.status !== 'Available') {
                setStage('unavailable');
                return;
            }

            // pre-load active customers (not blacklisted)
            const cRes = await customersAPI.getAll();
            setCustomers((cRes.data as Customer[]).filter(c => !c.isBlacklisted));

            setForm({ customerId: '', rentalDate: today(), returnDate: '', paymentMethod: 'Cash', paymentStatus: 'Pending', tax: 0, notes: '' });
            setStage('found');
        } catch (err) {
            const e = err as { response?: { status?: number } };
            setStage(e.response?.status === 404 ? 'not_found' : 'idle');
            if (e.response?.status !== 404) setErrMsg('Server error. Check connection.');
        }
    };

    // ── Step 2: validate form → show preview ───────────────────────────────
    const handlePreview = (e: React.FormEvent) => {
        e.preventDefault();
        setErrMsg('');
        if (!form.returnDate) { setErrMsg('Return date is required.'); return; }
        if (new Date(form.returnDate) <= new Date(form.rentalDate)) {
            setErrMsg('Return date must be after rental date.');
            return;
        }
        if (!form.customerId) { setErrMsg('Please select a customer.'); return; }
        setStage('preview');
    };

    // ── Step 3: save rental + invoice ──────────────────────────────────────
    const handleSave = async () => {
        if (!item) return;
        setSaving(true);
        setErrMsg('');
        try {
            // 1. create product rental
            const rentalRes = await rentalsAPI.create({
                customerId:    form.customerId,
                items:         [{ itemId: item._id, quantity: 1 }],
                dueDate:       form.returnDate,
                totalAmount:   total,
                paymentStatus: form.paymentStatus,
                notes:         form.notes,
            });
            const rental = rentalRes.data;

            // 2. create invoice linked to that rental
            const invRes = await invoicesAPI.create({
                customerId:      form.customerId,
                productRentalId: rental._id,
                items: [{
                    description: `${item.itemName} rental — ${days} day${days !== 1 ? 's' : ''} × Rs. ${rate}/day`,
                    quantity:    days,
                    unitPrice:   rate,
                    total:       subtotal,
                }],
                subtotal,
                tax:           Number(form.tax),
                totalAmount:   total,
                paymentMethod: form.paymentMethod,
                paymentStatus: form.paymentStatus,
                notes:         form.notes,
            });

            const customer = customers.find(c => c._id === form.customerId)!;
            setResult({
                invoiceId:     invRes.data.invoiceId,
                rentalId:      rental.rentalId,
                customerName:  `${customer.firstName} ${customer.lastName}`,
                itemName:      item.itemName,
                serial:        item.serialNumber,
                days,
                dailyRate:     rate,
                subtotal,
                tax:           Number(form.tax),
                total,
                rentalDate:    form.rentalDate,
                returnDate:    form.returnDate,
                paymentMethod: form.paymentMethod,
                paymentStatus: form.paymentStatus,
                notes:         form.notes,
            });
            setStage('done');
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            setErrMsg(e.response?.data?.message || 'Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Print ───────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${result?.invoiceId ?? ''}</title>
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
        setStage('idle'); setItem(null); setScannedId('');
        setErrMsg(''); setResult(null); setSaving(false);
        setForm({ customerId:'', rentalDate:today(), returnDate:'', paymentMethod:'Cash', paymentStatus:'Pending', tax:0, notes:'' });
    };

    // ─── render ──────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 820, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

            {/* Page header */}
            <div style={ps.pageHeader}>
                <div>
                    <h2 style={ps.pageTitle}>📷 QR Scanner → Invoice</h2>
                    <p style={ps.pageSub}>Scan an instrument QR code to auto-fill rental dates and generate an invoice instantly</p>
                </div>
                <button onClick={() => navigate('/admin/invoices')} style={ps.ghostBtn}>View All Invoices</button>
            </div>

            {/* ── IDLE ─────────────────────────────────────────────────────── */}
            {stage === 'idle' && (
                <div style={ps.card}>
                    <div style={{ textAlign:'center', padding:'40px 20px'}}>
                        <div style={{ fontSize:80, marginBottom:18 }}>🔲</div>
                        <h3 style={ps.cardTitle}>Scan an Instrument QR Code</h3>
                        <p style={ps.cardSub}>
                            Each inventory item has a unique QR code. Scan it to instantly load its
                            details, enter rental dates, and generate a cost-calculated invoice.
                        </p>
                        {errMsg && <p style={ps.err}>{errMsg}</p>}
                        <button onClick={() => setStage('scanning')} style={ps.primaryBtn}>
                            📷 Open Webcam Scanner
                        </button>
                        <p style={ps.tipText}>
                            💡 Tip: Go to <strong>Inventory</strong> → <em>View QR</em> to open the digital QR
                            for any instrument, then scan it here.
                        </p>
                    </div>
                </div>
            )}

            {/* ── NOT FOUND ────────────────────────────────────────────────── */}
            {stage === 'not_found' && (
                <div style={ps.card}>
                    <div style={{ textAlign:'center', padding:'36px 20px' }}>
                        <div style={{ fontSize:68, marginBottom:14 }}>❓</div>
                        <h3 style={ps.cardTitle}>QR Code Not Recognised</h3>
                        <p style={ps.cardSub}>
                            No inventory item matched: <code style={ps.code}>{scannedId}</code>
                        </p>
                        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
                            <button onClick={() => setStage('scanning')} style={ps.primaryBtn}>Scan Again</button>
                            <button onClick={reset} style={ps.ghostBtn}>Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── UNAVAILABLE ──────────────────────────────────────────────── */}
            {stage === 'unavailable' && item && (
                <div style={ps.card}>
                    <div style={{ textAlign:'center', padding:'36px 20px' }}>
                        <div style={{ fontSize:68, marginBottom:14 }}>🚫</div>
                        <h3 style={ps.cardTitle}>{item.itemName}</h3>
                        <p style={ps.cardSub}>
                            This item is currently <span style={statusBadge(item.status)}>{item.status}</span> and cannot be rented.
                        </p>
                        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
                            <button onClick={() => setStage('scanning')} style={ps.primaryBtn}>Scan Another</button>
                            <button onClick={reset} style={ps.ghostBtn}>Reset</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FOUND: item card ─────────────────────────────────────────── */}
            {stage === 'found' && item && (
                <div style={ps.card}>
                    {/* item summary */}
                    <div style={ps.itemBanner}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div>
                                <div style={ps.stepLabel}>✅ Instrument Found</div>
                                <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:'#0f172a' }}>{item.itemName}</h3>
                                <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748b' }}>
                                    {[item.brand, item.model].filter(Boolean).join(' / ')}
                                    {item.brand || item.model ? ' · ' : ''}
                                    Serial: <strong>{item.serialNumber}</strong>
                                </p>
                            </div>
                            <div style={{ textAlign:'right' }}>
                                <span style={statusBadge(item.status)}>{item.status}</span>
                                <div style={{ marginTop:8, fontSize:20, fontWeight:800, color:'#2563eb' }}>
                                    Rs. {item.baseRentalPrice}
                                    <span style={{ fontSize:12, fontWeight:500, color:'#64748b' }}>/day</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── rental form ── */}
                    <form onSubmit={handlePreview} style={{ marginTop:20 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                            <div style={{ ...FormStyles.group, gridColumn:'1 / -1' }}>
                                <label style={FormStyles.label}>Customer *</label>
                                <select style={FormStyles.select} value={form.customerId} required
                                    onChange={e => setForm({ ...form, customerId: e.target.value })}>
                                    <option value="">— Select Customer —</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.firstName} {c.lastName}  ·  {c.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={FormStyles.group}>
                                <label style={FormStyles.label}>Rental Date *</label>
                                <input type="date" style={FormStyles.input} value={form.rentalDate} required
                                    onChange={e => setForm({ ...form, rentalDate: e.target.value })} />
                            </div>

                            <div style={FormStyles.group}>
                                <label style={FormStyles.label}>Return Date *</label>
                                <input type="date" style={FormStyles.input} value={form.returnDate} required
                                    min={form.rentalDate}
                                    onChange={e => setForm({ ...form, returnDate: e.target.value })} />
                            </div>
                        </div>

                        {/* live cost preview */}
                        {form.returnDate && days > 0 && (
                            <div style={ps.costBox}>
                                <div style={ps.costTitle}>💰 Cost Preview</div>
                                <div style={ps.costRow}>
                                    <span>{days} day{days !== 1 ? 's' : ''} × Rs. {rate}/day</span>
                                    <strong>Rs. {subtotal}</strong>
                                </div>
                                <div style={{ ...ps.costRow, alignItems:'center' }}>
                                    <span>Tax / Other charges (Rs.)</span>
                                    <input type="number" min={0} value={form.tax === 0 ? '' : form.tax} style={{ ...FormStyles.input, width:110, margin:0, padding:'6px 10px' }}
                                        onChange={e => setForm({ ...form, tax: e.target.value === '' ? 0 : Number(e.target.value) })} />
                                </div>
                                <div style={ps.costTotal}>
                                    <span>Total</span>
                                    <span>Rs. {total}</span>
                                </div>
                            </div>
                        )}

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
                            <div style={FormStyles.group}>
                                <label style={FormStyles.label}>Payment Method *</label>
                                <select style={FormStyles.select} value={form.paymentMethod}
                                    onChange={e => setForm({ ...form, paymentMethod: e.target.value as PayMethod })}>
                                    <option>Cash</option>
                                    <option>Card</option>
                                    <option>Transfer</option>
                                </select>
                            </div>

                            <div style={FormStyles.group}>
                                <label style={FormStyles.label}>Payment Status</label>
                                <select style={FormStyles.select} value={form.paymentStatus}
                                    onChange={e => setForm({ ...form, paymentStatus: e.target.value as PayStatus })}>
                                    <option>Pending</option>
                                    <option>Paid</option>
                                </select>
                            </div>

                            <div style={{ ...FormStyles.group, gridColumn:'1 / -1' }}>
                                <label style={FormStyles.label}>Notes</label>
                                <textarea style={FormStyles.textarea} value={form.notes} placeholder="Optional notes…"
                                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>

                        {errMsg && <p style={{ ...ps.err, marginTop:12 }}>{errMsg}</p>}

                        <div style={ps.btnRow}>
                            <button type="submit" style={ps.primaryBtn}>Preview Invoice →</button>
                            <button type="button" onClick={() => setStage('scanning')} style={ps.ghostBtn}>Scan Again</button>
                            <button type="button" onClick={reset} style={ps.ghostBtn}>Reset</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── PREVIEW / DONE: printable invoice ────────────────────────── */}
            {(stage === 'preview' || stage === 'done') && item && (
                <div style={ps.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                        <div>
                            <div style={ps.stepLabel}>{stage === 'done' ? '✅ Invoice Saved!' : '👁 Invoice Preview'}</div>
                            <h3 style={{ margin:0, fontSize:20, fontWeight:800, color:'#0f172a' }}>
                                {stage === 'done' ? result?.invoiceId : 'Review before saving'}
                            </h3>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                            {stage === 'done' && <button onClick={handlePrint} style={ps.printBtn}>🖨 Print</button>}
                            {stage === 'preview' && <button onClick={() => setStage('found')} style={ps.ghostBtn}>← Edit</button>}
                        </div>
                    </div>

                    {/* ── printable area ── */}
                    <div ref={printRef} style={{ border:'1px solid #e2e8f0', borderRadius:10, padding:24 }}>

                        {/* invoice header */}
                        <div className="header" style={{ display:'flex', justifyContent:'space-between', paddingBottom:16, borderBottom:'2px solid #e2e8f0', marginBottom:20 }}>
                            <div>
                                <div className="logo" style={{ fontSize:22, fontWeight:800, color:'#2563eb' }}>🎵 ELVI Music Studio</div>
                                <div className="meta" style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                                    {stage === 'done'
                                        ? <><strong>Invoice:</strong> {result?.invoiceId}  ·  <strong>Rental:</strong> {result?.rentalId}</>
                                        : <em>Preview — not yet saved</em>
                                    }
                                </div>
                                <div style={{ fontSize:12, color:'#64748b' }}>Date: {fmtDate(today())}</div>
                            </div>
                            <div style={{ textAlign:'right', fontSize:13 }}>
                                <div style={{ fontWeight:700, fontSize:15 }}>
                                    {customers.find(c => c._id === form.customerId)?.firstName}{' '}
                                    {customers.find(c => c._id === form.customerId)?.lastName}
                                </div>
                                <div style={{ color:'#64748b' }}>
                                    {customers.find(c => c._id === form.customerId)?.phone}
                                </div>
                                {customers.find(c => c._id === form.customerId)?.email && (
                                    <div style={{ color:'#64748b' }}>
                                        {customers.find(c => c._id === form.customerId)?.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* instrument details */}
                        <div className="grid2" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, background:'#f8fafc', borderRadius:8, padding:'12px 16px', marginBottom:16, border:'1px solid #e2e8f0' }}>
                            {[
                                { l:'Instrument',  v: item.itemName },
                                { l:'Serial #',    v: item.serialNumber },
                                { l:'Rental Date', v: fmtDate(form.rentalDate) },
                                { l:'Return Date', v: fmtDate(form.returnDate) },
                            ].map(r => (
                                <div key={r.l}>
                                    <div className="lbl" style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{r.l}</div>
                                    <div className="val" style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{r.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* line items */}
                        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:0 }}>
                            <thead>
                                <tr>
                                    {['Description','Days','Rate / Day','Total'].map(h => (
                                        <th key={h} style={{ background:'#f8fafc', padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.4px', border:'1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={tc}>{item.itemName} Rental</td>
                                    <td style={tc}>{days}</td>
                                    <td style={tc}>Rs. {rate}</td>
                                    <td style={{ ...tc, fontWeight:600 }}>Rs. {subtotal}</td>
                                </tr>
                                <tr style={{ background:'#f8fafc' }}>
                                    <td colSpan={3} style={{ ...tc, textAlign:'right', fontWeight:600 }}>Subtotal</td>
                                    <td style={{ ...tc, fontWeight:600 }}>Rs. {subtotal}</td>
                                </tr>
                                {Number(form.tax) > 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ ...tc, textAlign:'right' }}>Tax / Other</td>
                                        <td style={tc}>Rs. {form.tax}</td>
                                    </tr>
                                )}
                                <tr style={{ background:'#eff6ff' }}>
                                    <td colSpan={3} style={{ ...tc, textAlign:'right', fontWeight:800, fontSize:15 }}>TOTAL</td>
                                    <td style={{ ...tc, fontWeight:800, fontSize:15, color:'#2563eb' }}>Rs. {total}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* footer row */}
                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, fontSize:13, color:'#64748b' }}>
                            <span>Payment: <strong style={{ color:'#1e293b' }}>{form.paymentMethod}</strong></span>
                            <span style={form.paymentStatus === 'Paid' ? StatusBadge.paid : StatusBadge.pending}>{form.paymentStatus}</span>
                        </div>
                        {form.notes && (
                            <div style={{ marginTop:10, padding:'8px 12px', background:'#f8fafc', borderRadius:6, fontSize:12, color:'#64748b' }}>
                                Notes: {form.notes}
                            </div>
                        )}
                        <div style={{ marginTop:18, fontSize:11, color:'#94a3b8', textAlign:'center', borderTop:'1px solid #e2e8f0', paddingTop:10 }}>
                            Thank you for choosing ELVI Music Studio
                        </div>
                    </div>

                    {errMsg && <p style={{ ...ps.err, marginTop:14 }}>{errMsg}</p>}

                    <div style={ps.btnRow}>
                        {stage === 'preview' && (
                            <button onClick={handleSave} style={ps.primaryBtn} disabled={saving}>
                                {saving ? 'Saving…' : '💾 Save Invoice & Create Rental'}
                            </button>
                        )}
                        {stage === 'done' && (
                            <>
                                <button onClick={handlePrint} style={ps.primaryBtn}>🖨 Print Invoice</button>
                                <button onClick={reset} style={ps.ghostBtn}>📷 Scan Next Item</button>
                                <button onClick={() => navigate('/admin/invoices')} style={ps.ghostBtn}>View All Invoices</button>
                            </>
                        )}
                        {stage === 'preview' && (
                            <button onClick={() => setStage('found')} style={ps.ghostBtn} disabled={saving}>← Edit</button>
                        )}
                    </div>
                </div>
            )}

            {/* webcam modal */}
            {stage === 'scanning' && (
                <QRScanner
                    onScanSuccess={handleScan}
                    onClose={() => setStage(item ? 'found' : 'idle')}
                />
            )}
        </div>
    );
};

// ─── styles ───────────────────────────────────────────────────────────────────
const tc: React.CSSProperties = { padding:'10px 12px', border:'1px solid #e2e8f0', fontSize:13, verticalAlign:'middle' };

const ps: Record<string, React.CSSProperties> = {
    pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
    pageTitle:  { margin:0, fontSize:22, fontWeight:800, color:'#0f172a' },
    pageSub:    { margin:'5px 0 0', fontSize:13, color:'#64748b' },
    card:       { background:'#fff', borderRadius:14, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' },
    cardTitle:  { margin:'0 0 10px', fontSize:18, fontWeight:700, color:'#0f172a' },
    cardSub:    { margin:'0 0 20px', fontSize:14, color:'#64748b', maxWidth:480, marginLeft:'auto', marginRight:'auto' },
    stepLabel:  { fontSize:11, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 },
    itemBanner: { background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'16px 18px' },
    costBox:    { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'16px 20px', marginTop:16 },
    costTitle:  { fontWeight:700, color:'#15803d', fontSize:14, marginBottom:10 },
    costRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, color:'#1e293b', marginBottom:8 },
    costTotal:  { display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, color:'#15803d', borderTop:'1px solid #bbf7d0', paddingTop:10, marginTop:4 },
    primaryBtn: { background:'#2563eb', color:'#fff', border:'none', padding:'10px 22px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600, boxShadow:'0 2px 8px rgba(37,99,235,0.3)' },
    ghostBtn:   { background:'transparent', color:'#64748b', border:'1.5px solid #e2e8f0', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:500 },
    printBtn:   { background:'#1e293b', color:'#fff', border:'none', padding:'9px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 },
    btnRow:     { display:'flex', gap:10, marginTop:22, flexWrap:'wrap' },
    err:        { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#b91c1c', margin:0 },
    tipText:    { marginTop:20, fontSize:12, color:'#94a3b8', lineHeight:1.6 },
    code:       { background:'#f1f5f9', padding:'2px 8px', borderRadius:4, fontFamily:'monospace', fontSize:12, color:'#475569' },
};

export default QRScannerPage;