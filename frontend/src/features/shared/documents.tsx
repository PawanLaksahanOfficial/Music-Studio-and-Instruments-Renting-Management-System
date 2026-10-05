import type { ReactNode } from 'react';
import { formatCalendarDate, formatCurrency, formatDate } from '@/lib/format';
import { fullName } from '@/lib/utils';
import type { Rental } from '@/types/api';
import type { InvoiceDocumentData } from './document-data';

/*
 * Printable documents. They always render as light "paper" (fixed colours rather than theme
 * tokens) so they look the same on screen in dark mode and on the printer.
 */

const Letterhead = ({ right }: { right: ReactNode }) => (
    <header className="flex flex-col gap-6 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 [print-color-adjust:exact]">
                <svg viewBox="0 0 64 64" className="size-7" aria-hidden>
                    <g fill="#fff">
                        <rect x="6" y="24" width="7" height="16" rx="3.5" />
                        <rect x="18" y="14" width="7" height="36" rx="3.5" />
                        <rect x="30" y="6" width="7" height="52" rx="3.5" />
                        <rect x="42" y="16" width="7" height="32" rx="3.5" />
                        <rect x="54" y="25" width="7" height="14" rx="3.5" />
                    </g>
                </svg>
            </span>
            <div>
                <p className="text-lg font-bold tracking-tight">ELVI Music Studio</p>
                <p className="text-xs text-zinc-500">Instrument rentals · Studio hire</p>
            </div>
        </div>
        <div className="sm:text-right">{right}</div>
    </header>
);

const Paper = ({ children }: { children: ReactNode }) => (
    <article className="mx-auto w-full max-w-[760px] rounded-xl bg-white p-6 text-sm text-zinc-900 shadow-sm ring-1 ring-zinc-200 sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0">
        {children}
    </article>
);

const StatusStamp = ({ paid }: { paid: boolean }) => (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold [print-color-adjust:exact] ${paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
        {paid ? 'PAID' : 'PAYMENT DUE'}
    </span>
);

export const InvoiceDocument = ({ data }: { data: InvoiceDocumentData }) => (
    <Paper>
        <Letterhead
            right={
                <>
                    <p className="text-2xl font-bold tracking-tight text-zinc-900">{data.draft ? 'Invoice preview' : 'Invoice'}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{data.invoiceId ?? 'Not saved yet'}</p>
                    <p className="text-xs text-zinc-500">{formatDate(data.date)}</p>
                    {!data.draft && <div className="mt-2"><StatusStamp paid={data.paymentStatus === 'Paid'} /></div>}
                </>
            }
        />
        <section className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-zinc-500">Billed to</p>
                <p className="mt-1.5 font-semibold">{fullName(data.customer)}</p>
                {data.customer?.phone && <p className="text-zinc-600">{data.customer.phone}</p>}
                {data.customer?.email && <p className="text-zinc-600">{data.customer.email}</p>}
            </div>
            {data.references && data.references.length > 0 && (
                <div className="sm:text-right">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-zinc-500">References</p>
                    <p className="mt-1.5 font-mono text-xs text-zinc-700">{data.references.join(', ')}</p>
                </div>
            )}
        </section>
        <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
                <thead>
                    <tr className="border-y border-zinc-200 bg-zinc-50 text-left text-[0.6875rem] uppercase tracking-wider text-zinc-500 [print-color-adjust:exact]">
                        <th className="px-3 py-2.5 font-semibold">Description</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Unit price</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.lines.map((line, i) => (
                        <tr key={i} className="border-b border-zinc-100">
                            <td className="px-3 py-3">{line.description}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{line.quantity}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(line.unitPrice)}</td>
                            <td className="px-3 py-3 text-right font-medium tabular-nums">{formatCurrency(line.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <section className="ml-auto mt-4 w-full max-w-64 space-y-2 tabular-nums">
            <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
            {data.tax > 0 && <div className="flex justify-between text-zinc-600"><span>Tax / other</span><span>{formatCurrency(data.tax)}</span></div>}
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold"><span>Total</span><span>{formatCurrency(data.total)}</span></div>
        </section>
        <footer className="mt-8 grid gap-3 border-t border-zinc-200 pt-5 text-xs text-zinc-600 sm:grid-cols-3">
            <p>Payment method: <span className="font-semibold text-zinc-900">{data.paymentMethod}</span></p>
            <p>Status: <span className="font-semibold text-zinc-900">{data.paymentStatus}</span></p>
            {data.issuedBy && <p>Issued by: <span className="font-semibold text-zinc-900">{data.issuedBy}</span></p>}
        </footer>
        {data.notes && <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 [print-color-adjust:exact]">Notes: {data.notes}</p>}
        <p className="mt-8 text-center text-xs text-zinc-400">Thank you for choosing ELVI Music Studio.</p>
    </Paper>
);

export const ReturnReceipt = ({ rental }: { rental: Rental }) => {
    const base = rental.baseAmount ?? rental.totalAmount - rental.lateFee - rental.damageCharges;
    return (
        <Paper>
            <Letterhead
                right={
                    <>
                        <p className="text-2xl font-bold tracking-tight">Return receipt</p>
                        <p className="mt-1 font-mono text-xs text-zinc-500">{rental.rentalId}</p>
                        <p className="text-xs text-zinc-500">Returned {formatCalendarDate(rental.returnDate)}</p>
                        <div className="mt-2"><StatusStamp paid={rental.paymentStatus === 'Paid'} /></div>
                    </>
                }
            />
            <section className="grid gap-6 py-6 sm:grid-cols-2">
                <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-zinc-500">Customer</p>
                    <p className="mt-1.5 font-semibold">{fullName(rental.customer)}</p>
                    {rental.customer?.phone && <p className="text-zinc-600">{rental.customer.phone}</p>}
                </div>
                <div className="sm:text-right">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-zinc-500">Rental period</p>
                    <p className="mt-1.5">{formatCalendarDate(rental.rentalDate)} → {formatCalendarDate(rental.dueDate)}</p>
                </div>
            </section>
            <ul className="divide-y divide-zinc-100 border-y border-zinc-200">
                {rental.items.map((item, i) => (
                    <li key={i} className="flex justify-between gap-4 px-1 py-2.5">
                        <span>{item.itemId?.itemName ?? 'Item'}</span>
                        <span className="font-mono text-xs text-zinc-500">{item.itemId?.serialNumber}</span>
                    </li>
                ))}
            </ul>
            <section className="ml-auto mt-5 w-full max-w-72 space-y-2 tabular-nums">
                <div className="flex justify-between text-zinc-600"><span>Rental charge</span><span>{formatCurrency(base)}</span></div>
                {rental.lateFee > 0 && <div className="flex justify-between text-red-700"><span>Late return fee</span><span>+ {formatCurrency(rental.lateFee)}</span></div>}
                {rental.damageCharges > 0 && <div className="flex justify-between text-orange-700"><span>Damage charges</span><span>+ {formatCurrency(rental.damageCharges)}</span></div>}
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold"><span>Total</span><span>{formatCurrency(rental.totalAmount)}</span></div>
            </section>
            {rental.damageNotes && <p className="mt-5 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 [print-color-adjust:exact]">Damage notes: {rental.damageNotes}</p>}
            <p className="mt-6 text-xs text-zinc-600">Payment: <span className="font-semibold text-zinc-900">{rental.paymentStatus}{rental.paymentMethod ? ` · ${rental.paymentMethod}` : ''}</span></p>
            <p className="mt-8 text-center text-xs text-zinc-400">Thank you for returning your rental to ELVI Music Studio.</p>
        </Paper>
    );
};
