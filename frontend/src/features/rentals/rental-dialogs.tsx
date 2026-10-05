import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { useCreateRental, useExtendRental, useUpdateRental } from '@/api/rentals';
import { getErrorMessage } from '@/lib/api';
import { PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES } from '@/lib/constants';
import { addDaysInput, calendarToInput, daysBetweenInputs, formatCalendarDate, formatCurrency, todayInput } from '@/lib/format';
import { fullName } from '@/lib/utils';
import type { PaymentMethod, Rental, RentalPaymentStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Combobox, MultiCombobox } from '@/components/ui/combobox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Detail } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { useAvailableItemOptions, useCustomerOptions } from '@/features/shared/options';
import { ReturnAssessment } from '@/features/returns/return-assessment';

/* ── New rental ─────────────────────────────────────────────────────────── */

const newRentalSchema = z
    .object({
        customerId: z.string().min(1, 'Choose a customer'),
        itemIds: z.array(z.string()).min(1, 'Choose at least one item'),
        rentalDate: z.string().min(1, 'Required'),
        dueDate: z.string().min(1, 'Choose a due date'),
        paymentStatus: z.enum(RENTAL_PAYMENT_STATUSES),
        paymentMethod: z.union([z.enum(PAYMENT_METHODS), z.literal('')]),
        notes: z.string().max(1000),
    })
    .refine(v => v.rentalDate >= todayInput(), { message: 'Cannot be in the past', path: ['rentalDate'] })
    .refine(v => v.dueDate >= v.rentalDate, { message: 'Must be on or after the rental date', path: ['dueDate'] });
type NewRentalValues = z.infer<typeof newRentalSchema>;

export const NewRentalDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const customers = useCustomerOptions();
    const items = useAvailableItemOptions();
    const createRental = useCreateRental();
    const [error, setError] = useState<string | null>(null);

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<NewRentalValues>({
        resolver: zodResolver(newRentalSchema),
        defaultValues: { customerId: '', itemIds: [], rentalDate: todayInput(), dueDate: addDaysInput(todayInput(), 1), paymentStatus: 'Pending', paymentMethod: '', notes: '' },
    });

    const [itemIds, rentalDate, dueDate] = useWatch({ control, name: ['itemIds', 'rentalDate', 'dueDate'] });
    const days = Math.max(1, daysBetweenInputs(rentalDate, dueDate));
    const dailyTotal = items.available.filter(i => itemIds.includes(i._id)).reduce((sum, i) => sum + i.baseRentalPrice, 0);

    const close = (next: boolean) => {
        if (!next) { reset(); setError(null); }
        onOpenChange(next);
    };

    const onSubmit = async (values: NewRentalValues) => {
        setError(null);
        try {
            const { rental } = await createRental.mutateAsync({
                ...values,
                paymentMethod: values.paymentMethod || undefined,
                notes: values.notes || undefined,
            });
            toast.success(`Rental ${rental.rentalId} created`, { description: `${formatCurrency(rental.totalAmount)} · due ${formatCalendarDate(rental.dueDate)}` });
            close(false);
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle>New rental</DialogTitle>
                    <DialogDescription>Only available items are listed. The price is confirmed by the server when you save.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
                    <DialogBody className="space-y-4">
                        <FormError message={error} />
                        <Field label="Customer" required error={errors.customerId?.message}>
                            <Controller
                                control={control}
                                name="customerId"
                                render={({ field }) => (
                                    <Combobox options={customers.options} value={field.value} onChange={field.onChange} loading={customers.isLoading}
                                        placeholder="Search by name, phone or NIC" searchPlaceholder="Name, phone or NIC…" emptyText="No customers found" />
                                )}
                            />
                        </Field>
                        <Field label="Items" required error={errors.itemIds?.message}>
                            <Controller
                                control={control}
                                name="itemIds"
                                render={({ field }) => (
                                    <MultiCombobox options={items.options} values={field.value} onChange={field.onChange} loading={items.isLoading}
                                        placeholder="Add instruments or gear" searchPlaceholder="Name, serial or brand…" emptyText="No available items" />
                                )}
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Rental date" required error={errors.rentalDate?.message}>
                                <Input type="date" min={todayInput()} {...register('rentalDate')} />
                            </Field>
                            <Field label="Due back" required error={errors.dueDate?.message}>
                                <Input type="date" min={rentalDate} {...register('dueDate')} />
                            </Field>
                            <Field label="Payment status">
                                <NativeSelect {...register('paymentStatus')}>
                                    {RENTAL_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                                </NativeSelect>
                            </Field>
                            <Field label="Payment method">
                                <NativeSelect {...register('paymentMethod')}>
                                    <option value="">Not recorded</option>
                                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                </NativeSelect>
                            </Field>
                        </div>
                        <Field label="Notes" error={errors.notes?.message}>
                            <Textarea rows={2} placeholder="Optional" {...register('notes')} />
                        </Field>
                        <div className="flex items-center justify-between rounded-xl bg-primary/8 px-4 py-3 text-sm">
                            <span className="text-muted-foreground">{days} day{days === 1 ? '' : 's'} × {formatCurrency(dailyTotal)}/day</span>
                            <span className="text-lg font-semibold tabular-nums">{formatCurrency(days * dailyTotal)}</span>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
                        <Button type="submit" loading={createRental.isPending}>Create rental</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* ── Edit / extend ──────────────────────────────────────────────────────── */

export const EditRentalDialog = ({ rental, onOpenChange }: { rental: Rental | null; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={rental !== null} onOpenChange={onOpenChange}>
        <DialogContent size="md">
            {rental && <EditRentalForm key={rental._id} rental={rental} onClose={() => onOpenChange(false)} />}
        </DialogContent>
    </Dialog>
);

const EditRentalForm = ({ rental, onClose }: { rental: Rental; onClose: () => void }) => {
    const update = useUpdateRental();
    const extend = useExtendRental();
    const [paymentStatus, setPaymentStatus] = useState<RentalPaymentStatus>(rental.paymentStatus);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(rental.paymentMethod ?? '');
    const [notes, setNotes] = useState(rental.notes ?? '');
    const [newDueDate, setNewDueDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const isOpen = rental.status !== 'Returned';
    const dailyTotal = rental.items.reduce((sum, i) => sum + (i.dailyRate ?? i.itemId?.baseRentalPrice ?? 0), 0);
    const extendedDays = newDueDate ? Math.max(1, daysBetweenInputs(calendarToInput(rental.rentalDate), newDueDate)) : 0;
    const minExtend = [todayInput(), calendarToInput(rental.dueDate)].sort()[1];

    const save = async () => {
        setError(null);
        try {
            await update.mutateAsync({ id: rental._id, paymentStatus, paymentMethod: paymentMethod || undefined, notes });
            if (newDueDate) await extend.mutateAsync({ id: rental._id, newDueDate });
            toast.success(`Rental ${rental.rentalId} updated`);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Rental {rental.rentalId}</DialogTitle>
                <DialogDescription>{fullName(rental.customer)} · {rental.items.map(i => i.itemId?.itemName).filter(Boolean).join(', ')}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-5">
                <FormError message={error} />
                <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-4">
                    <Detail label="Status"><StatusBadge status={rental.status} /></Detail>
                    <Detail label="Rented">{formatCalendarDate(rental.rentalDate)}</Detail>
                    <Detail label="Due">{formatCalendarDate(rental.dueDate)}</Detail>
                    <Detail label="Total">{formatCurrency(rental.totalAmount)}</Detail>
                </dl>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Payment status">
                        <NativeSelect value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as RentalPaymentStatus)}>
                            {RENTAL_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                    </Field>
                    <Field label="Payment method">
                        <NativeSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod | '')}>
                            <option value="">Not recorded</option>
                            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                        </NativeSelect>
                    </Field>
                </div>
                <Field label="Notes">
                    <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                </Field>
                {isOpen && (
                    <div className="rounded-xl border p-4">
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarPlus className="size-4 text-muted-foreground" /> Extend rental</p>
                        <Field label="New due date" hint={newDueDate ? `New total: ${extendedDays} days × ${formatCurrency(dailyTotal)} = ${formatCurrency(extendedDays * dailyTotal)}` : 'The rental is re-priced for the new period.'}>
                            <Input type="date" min={minExtend} value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                        </Field>
                    </div>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={save} loading={update.isPending || extend.isPending}>Save changes</Button>
            </DialogFooter>
        </>
    );
};

/* ── Return ─────────────────────────────────────────────────────────────── */

export const ReturnRentalDialog = ({ rental, onOpenChange }: { rental: Rental | null; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={rental !== null} onOpenChange={onOpenChange}>
        <DialogContent size="lg">
            <DialogHeader>
                <DialogTitle>Process return</DialogTitle>
                <DialogDescription>Check the condition of each item. Late fees are calculated automatically.</DialogDescription>
            </DialogHeader>
            <DialogBody className="pb-6">
                {rental && (
                    <ReturnAssessment
                        key={rental._id}
                        rental={rental}
                        onCancel={() => onOpenChange(false)}
                        onDone={returned => {
                            toast.success(`${returned.rentalId} returned`, { description: `Total ${formatCurrency(returned.totalAmount)} · ${returned.paymentStatus}` });
                            onOpenChange(false);
                        }}
                    />
                )}
            </DialogBody>
        </DialogContent>
    </Dialog>
);
