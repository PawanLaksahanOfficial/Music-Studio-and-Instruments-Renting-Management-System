import { useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarClock, Loader2, Wrench } from 'lucide-react';
import { useReturnQuote, useReturnRental } from '@/api/rentals';
import { getErrorMessage } from '@/lib/api';
import { PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES } from '@/lib/constants';
import { formatCalendarDate, formatCurrency, todayInput } from '@/lib/format';
import { cn, fullName } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { PaymentMethod, Rental, RentalPaymentStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Detail } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';

interface ReturnAssessmentProps {
    rental: Rental;
    onDone: (returned: Rental) => void;
    onCancel?: () => void;
    cancelLabel?: string;
}

/**
 * Collects the return details. Late fees come from the server (quote endpoint) so the preview
 * always matches what will be charged; only admins can override them.
 */
export const ReturnAssessment = ({ rental, onDone, onCancel, cancelLabel = 'Cancel' }: ReturnAssessmentProps) => {
    const { isAdmin } = useAuth();
    const minDate = rental.rentalDate.slice(0, 10);
    const [returnDate, setReturnDate] = useState(() => (todayInput() < minDate ? minDate : todayInput()));
    const [damaged, setDamaged] = useState<string[]>([]);
    const [damageCharges, setDamageCharges] = useState('');
    const [damageNotes, setDamageNotes] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<RentalPaymentStatus>(rental.paymentStatus === 'Paid' ? 'Paid' : 'Pending');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(rental.paymentMethod ?? 'Cash');
    const [overrideFee, setOverrideFee] = useState(false);
    const [lateFeeOverride, setLateFeeOverride] = useState('');
    const [error, setError] = useState<string | null>(null);

    const quote = useReturnQuote(rental._id, returnDate);
    const returnRental = useReturnRental();

    const items = rental.items.filter(i => i.itemId);
    const damage = Number(damageCharges) || 0;
    const lateFee = overrideFee ? Number(lateFeeOverride) || 0 : quote.data?.lateFee ?? 0;
    const base = quote.data?.baseAmount ?? rental.baseAmount ?? rental.totalAmount;
    const total = base + lateFee + damage;
    const needsDamagedItems = damage > 0 && items.length > 1 && damaged.length === 0;

    const toggleDamaged = (id: string, checked: boolean) =>
        setDamaged(current => (checked ? [...current, id] : current.filter(d => d !== id)));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (needsDamagedItems) {
            setError('Select which items were damaged.');
            return;
        }
        try {
            const returned = await returnRental.mutateAsync({
                id: rental._id,
                returnDate,
                damageCharges: damage,
                damageNotes: damageNotes || undefined,
                damagedItemIds: damaged,
                paymentStatus,
                paymentMethod,
                lateFeeOverride: overrideFee ? Number(lateFeeOverride) || 0 : undefined,
            });
            onDone(returned);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Rental summary */}
            <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-semibold">{fullName(rental.customer)}</p>
                        <p className="text-sm text-muted-foreground">{rental.customer?.phone} · <span className="font-mono">{rental.rentalId}</span></p>
                    </div>
                    <StatusBadge status={rental.status} />
                </div>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Detail label="Rented on">{formatCalendarDate(rental.rentalDate)}</Detail>
                    <Detail label="Due back">{formatCalendarDate(rental.dueDate)}</Detail>
                    <Detail label="Rental charge">{formatCurrency(base)}</Detail>
                </dl>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Return date" required>
                    <Input type="date" value={returnDate} min={minDate} max={todayInput()} onChange={e => setReturnDate(e.target.value)} required />
                </Field>
                <Field label="Payment status">
                    <NativeSelect value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as RentalPaymentStatus)}>
                        {RENTAL_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </NativeSelect>
                </Field>
                <Field label="Payment method">
                    <NativeSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </NativeSelect>
                </Field>
            </div>

            {/* Late return */}
            {(quote.data?.lateDays ?? 0) > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
                    <div className="flex items-start gap-3">
                        <CalendarClock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <p className="font-medium">Returned {quote.data!.lateDays} day{quote.data!.lateDays === 1 ? '' : 's'} late</p>
                            <p className="text-sm text-muted-foreground">
                                {quote.data!.lateDays} × {formatCurrency(quote.data!.dailyTotal)}/day = <span className="font-medium text-foreground">{formatCurrency(quote.data!.lateFee)}</span>
                            </p>
                            {isAdmin && (
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox checked={overrideFee} onCheckedChange={v => setOverrideFee(v === true)} />
                                        Adjust late fee
                                    </label>
                                    {overrideFee && (
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            value={lateFeeOverride}
                                            onChange={e => setLateFeeOverride(e.target.value)}
                                            placeholder={String(quote.data!.lateFee)}
                                            aria-label="Adjusted late fee"
                                            className="sm:w-40"
                                            leading={<span className="text-xs">Rs.</span>}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Damage */}
            <fieldset className="space-y-3">
                <legend className="mb-2 flex items-center gap-2 text-sm font-semibold"><Wrench className="size-4 text-muted-foreground" aria-hidden /> Condition check</legend>
                <ul className="divide-y rounded-xl border">
                    {items.map(item => {
                        const id = item.itemId!._id;
                        const isDamaged = damaged.includes(id);
                        return (
                            <li key={id}>
                                <label className={cn('flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors', isDamaged && 'bg-red-500/5')}>
                                    <Checkbox checked={isDamaged} onCheckedChange={v => toggleDamaged(id, v === true)} aria-label={`${item.itemId!.itemName} is damaged`} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{item.itemId!.itemName}</span>
                                        <span className="block font-mono text-xs text-muted-foreground">{item.itemId!.serialNumber}</span>
                                    </span>
                                    <span className={cn('text-xs font-medium', isDamaged ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                                        {isDamaged ? 'Damaged' : 'Good'}
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
                <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                    <Field label="Damage charges" hint="Leave empty if nothing is damaged">
                        <Input type="number" inputMode="decimal" min={0} step="0.01" value={damageCharges} onChange={e => setDamageCharges(e.target.value)} placeholder="0" leading={<span className="text-xs">Rs.</span>} />
                    </Field>
                    <Field label="Damage notes">
                        <Textarea rows={2} value={damageNotes} onChange={e => setDamageNotes(e.target.value)} placeholder="Describe any damage (optional)" className="min-h-10" />
                    </Field>
                </div>
            </fieldset>

            {/* Bill */}
            <div className="rounded-xl border bg-card p-4">
                <div className="space-y-2 text-sm tabular-nums">
                    <div className="flex justify-between"><span className="text-muted-foreground">Rental charge</span><span>{formatCurrency(base)}</span></div>
                    {lateFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Late fee{overrideFee ? ' (adjusted)' : ''}</span><span className="text-red-600 dark:text-red-400">+ {formatCurrency(lateFee)}</span></div>}
                    {damage > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Damage charges</span><span className="text-orange-600 dark:text-orange-400">+ {formatCurrency(damage)}</span></div>}
                    <div className="flex items-center justify-between border-t pt-3">
                        <span className="font-semibold">Total due</span>
                        <span className="flex items-center gap-2 text-xl font-semibold">
                            {quote.isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Updating" />}
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>
            </div>

            {needsDamagedItems && (
                <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="size-4" /> Tick the damaged items above.</p>
            )}
            <FormError message={error} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onCancel && <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>}
                <Button type="submit" loading={returnRental.isPending} disabled={quote.isPending}>Complete return</Button>
            </div>
        </form>
    );
};
