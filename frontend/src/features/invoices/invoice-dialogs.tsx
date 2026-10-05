import { useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CircleCheck, Plus, Printer, Trash2 } from 'lucide-react';
import { useCreateInvoice, useInvoices, useUpdateInvoicePayment } from '@/api/invoices';
import { useRentals } from '@/api/rentals';
import { useStudioBookings } from '@/api/studio';
import { getErrorMessage } from '@/lib/api';
import { PAYMENT_METHODS, SIMPLE_PAYMENT_STATUSES } from '@/lib/constants';
import { formatCalendarDate, formatCurrency, formatDate } from '@/lib/format';
import type { Invoice } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Combobox, MultiCombobox, type ComboboxOption } from '@/components/ui/combobox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError, Label } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { PrintPortal } from '@/components/data/page';
import { InvoiceDocument } from '@/features/shared/documents';
import { invoiceToDocument } from '@/features/shared/document-data';
import { useCustomerOptions } from '@/features/shared/options';

const schema = z
    .object({
        customerId: z.string().min(1, 'Choose a customer'),
        productRentalIds: z.array(z.string()),
        studioRentalIds: z.array(z.string()),
        items: z.array(z.object({
            description: z.string().trim().min(1, 'Required').max(200),
            quantity: z.number({ error: 'Required' }).int('Whole number').min(1, 'At least 1'),
            unitPrice: z.number({ error: 'Required' }).min(0, 'Cannot be negative'),
        })),
        tax: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
        paymentMethod: z.enum(PAYMENT_METHODS),
        paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES),
        notes: z.string().max(1000),
    })
    .refine(v => v.productRentalIds.length + v.studioRentalIds.length + v.items.length > 0, {
        message: 'Link a rental or booking, or add a line item',
        path: ['items'],
    });
type FormValues = z.infer<typeof schema>;

const defaults: FormValues = { customerId: '', productRentalIds: [], studioRentalIds: [], items: [], tax: 0, paymentMethod: 'Cash', paymentStatus: 'Pending', notes: '' };

export const NewInvoiceDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl">{open && <NewInvoiceForm onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
);

const NewInvoiceForm = ({ onClose }: { onClose: () => void }) => {
    const customers = useCustomerOptions({ allowBlacklisted: true });
    const rentals = useRentals();
    const bookings = useStudioBookings();
    const invoices = useInvoices();
    const createInvoice = useCreateInvoice();
    const [error, setError] = useState<string | null>(null);

    const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });
    const lines = useFieldArray({ control, name: 'items' });
    const values = useWatch({ control }) as FormValues;

    // Rentals and bookings already on an invoice can't be billed twice.
    const invoiced = useMemo(() => {
        const ids = new Set<string>();
        for (const inv of invoices.data ?? []) {
            inv.productRentals.forEach(r => ids.add(r._id));
            inv.studioRentals.forEach(b => ids.add(b._id));
        }
        return ids;
    }, [invoices.data]);

    const rentalOptions = useMemo<ComboboxOption[]>(() =>
        (rentals.data ?? [])
            .filter(r => r.customer?._id === values.customerId && !invoiced.has(r._id))
            .map(r => ({
                value: r._id,
                label: r.rentalId,
                description: `${r.items.map(i => i.itemId?.itemName).filter(Boolean).join(', ')} · ${formatCurrency(r.totalAmount)} · due ${formatCalendarDate(r.dueDate)}`,
            })), [rentals.data, values.customerId, invoiced]);

    const bookingOptions = useMemo<ComboboxOption[]>(() =>
        (bookings.data ?? [])
            .filter(b => b.customer?._id === values.customerId && !invoiced.has(b._id) && b.status !== 'Cancelled')
            .map(b => ({ value: b._id, label: b.bookingId, description: `${b.roomName} · ${formatDate(b.startTime)} · ${formatCurrency(b.totalAmount)}` })),
    [bookings.data, values.customerId, invoiced]);

    const linkedTotal =
        (rentals.data ?? []).filter(r => values.productRentalIds.includes(r._id)).reduce((s, r) => s + r.totalAmount, 0)
        + (bookings.data ?? []).filter(b => values.studioRentalIds.includes(b._id)).reduce((s, b) => s + b.totalAmount, 0);
    const manualTotal = values.items.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
    const tax = Number.isFinite(values.tax) ? values.tax : 0;

    const onSubmit = async (v: FormValues) => {
        setError(null);
        try {
            const invoice = await createInvoice.mutateAsync({ ...v, notes: v.notes || undefined });
            toast.success(`Invoice ${invoice.invoiceId} created`, { description: formatCurrency(invoice.totalAmount) });
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
                <DialogTitle>New invoice</DialogTitle>
                <DialogDescription>Link rentals and bookings, or add your own lines. Totals are confirmed by the server.</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-5">
                <FormError message={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Customer" required error={errors.customerId?.message} className="sm:col-span-2">
                        <Controller
                            control={control}
                            name="customerId"
                            render={({ field }) => (
                                <Combobox
                                    options={customers.options}
                                    value={field.value}
                                    onChange={id => { field.onChange(id); setValue('productRentalIds', []); setValue('studioRentalIds', []); }}
                                    loading={customers.isLoading}
                                    placeholder="Search by name, phone or NIC"
                                    searchPlaceholder="Name, phone or NIC…"
                                    emptyText="No customers found"
                                />
                            )}
                        />
                    </Field>
                    <Field label="Product rentals" hint={values.customerId && !rentalOptions.length ? 'No unbilled rentals for this customer' : undefined}>
                        <Controller control={control} name="productRentalIds" render={({ field }) => (
                            <MultiCombobox options={rentalOptions} values={field.value} onChange={field.onChange} disabled={!values.customerId}
                                placeholder={values.customerId ? 'Link rentals' : 'Choose a customer first'} emptyText="No unbilled rentals" />
                        )} />
                    </Field>
                    <Field label="Studio bookings" hint={values.customerId && !bookingOptions.length ? 'No unbilled bookings for this customer' : undefined}>
                        <Controller control={control} name="studioRentalIds" render={({ field }) => (
                            <MultiCombobox options={bookingOptions} values={field.value} onChange={field.onChange} disabled={!values.customerId}
                                placeholder={values.customerId ? 'Link bookings' : 'Choose a customer first'} emptyText="No unbilled bookings" />
                        )} />
                    </Field>
                </div>

                <section aria-labelledby="lines-heading" className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label id="lines-heading">Additional lines</Label>
                        <Button variant="soft" size="sm" onClick={() => lines.append({ description: '', quantity: 1, unitPrice: 0 })}><Plus /> Add line</Button>
                    </div>
                    {lines.fields.length === 0 ? (
                        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Add lines for strings, accessories, delivery or other charges.</p>
                    ) : (
                        <ul className="space-y-3">
                            {lines.fields.map((line, index) => {
                                const lineErrors = errors.items?.[index];
                                const amount = (Number(values.items[index]?.quantity) || 0) * (Number(values.items[index]?.unitPrice) || 0);
                                return (
                                    <li key={line.id} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_5.5rem_8rem_7rem_auto] sm:items-start sm:border-0 sm:p-0">
                                        <Field label="Description" error={lineErrors?.description?.message} className="sm:[&>label]:sr-only">
                                            <Input placeholder="Description" {...register(`items.${index}.description`)} />
                                        </Field>
                                        <Field label="Qty" error={lineErrors?.quantity?.message} className="sm:[&>label]:sr-only">
                                            <Input type="number" inputMode="numeric" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                                        </Field>
                                        <Field label="Unit price" error={lineErrors?.unitPrice?.message} className="sm:[&>label]:sr-only">
                                            <Input type="number" inputMode="decimal" min={0} step="0.01" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                                        </Field>
                                        <p className="flex h-10 items-center justify-between text-sm font-medium tabular-nums sm:justify-end">
                                            <span className="text-muted-foreground sm:hidden">Amount</span>{formatCurrency(amount)}
                                        </p>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => lines.remove(index)} aria-label={`Remove line ${index + 1}`}>
                                            <Trash2 />
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {errors.items?.root?.message || errors.items?.message ? (
                        <p role="alert" className="text-xs font-medium text-destructive">{errors.items?.root?.message ?? errors.items?.message}</p>
                    ) : null}
                </section>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Tax / other" error={errors.tax?.message}>
                        <Input type="number" inputMode="decimal" min={0} step="0.01" leading={<span className="text-xs">Rs.</span>} {...register('tax', { valueAsNumber: true })} />
                    </Field>
                    <Field label="Payment method">
                        <NativeSelect {...register('paymentMethod')}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</NativeSelect>
                    </Field>
                    <Field label="Payment status">
                        <NativeSelect {...register('paymentStatus')}>{SIMPLE_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</NativeSelect>
                    </Field>
                </div>
                <Field label="Notes"><Textarea rows={2} placeholder="Optional" {...register('notes')} /></Field>

                <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm tabular-nums">
                    <div className="flex justify-between text-muted-foreground"><span>Linked items</span><span>{formatCurrency(linkedTotal)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Additional lines</span><span>{formatCurrency(manualTotal)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Tax / other</span><span>{formatCurrency(tax)}</span></div>
                    <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{formatCurrency(linkedTotal + manualTotal + tax)}</span></div>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={createInvoice.isPending}>Create invoice</Button>
            </DialogFooter>
        </form>
    );
};

export const ViewInvoiceDialog = ({ invoice, onOpenChange }: { invoice: Invoice | null; onOpenChange: (open: boolean) => void }) => {
    const updatePayment = useUpdateInvoicePayment();

    const markPaid = async () => {
        if (!invoice) return;
        try {
            await updatePayment.mutateAsync({ id: invoice._id, paymentStatus: 'Paid' });
            toast.success(`${invoice.invoiceId} marked as paid`);
            onOpenChange(false);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <Dialog open={invoice !== null} onOpenChange={onOpenChange}>
            <DialogContent size="xl">
                {invoice && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invoice {invoice.invoiceId}</DialogTitle>
                            <DialogDescription>Issued {formatDate(invoice.createdAt)}{invoice.paidAt ? ` · paid ${formatDate(invoice.paidAt)}` : ''}</DialogDescription>
                        </DialogHeader>
                        <DialogBody className="bg-muted/40 py-4">
                            <InvoiceDocument data={invoiceToDocument(invoice)} />
                            <PrintPortal><InvoiceDocument data={invoiceToDocument(invoice)} /></PrintPortal>
                        </DialogBody>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
                            {invoice.paymentStatus === 'Pending' && <Button onClick={markPaid} loading={updatePayment.isPending}><CircleCheck /> Mark as paid</Button>}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
