import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CircleCheckBig, Printer, ReceiptText, ScanLine } from 'lucide-react';
import { fetchInventoryByQr } from '@/api/inventory';
import { useCreateRental } from '@/api/rentals';
import { getErrorCode, getErrorMessage } from '@/lib/api';
import { PAYMENT_METHODS, SIMPLE_PAYMENT_STATUSES } from '@/lib/constants';
import { addDaysInput, daysBetweenInputs, formatCurrency, todayInput } from '@/lib/format';
import type { InventoryItem, Invoice } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { PageHeader, PrintPortal } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { Stepper } from '@/components/data/stepper';
import { ScanStep } from '@/components/qr/scan-step';
import { InvoiceDocument } from '@/features/shared/documents';
import { invoiceToDocument, type InvoiceDocumentData } from '@/features/shared/document-data';
import { useCustomerOptions } from '@/features/shared/options';

type Stage = 'scan' | 'details' | 'review' | 'done';
const STAGES: Stage[] = ['scan', 'details', 'review', 'done'];

const schema = z
    .object({
        customerId: z.string().min(1, 'Choose a customer'),
        rentalDate: z.string().min(1, 'Required'),
        dueDate: z.string().min(1, 'Choose a return date'),
        paymentMethod: z.enum(PAYMENT_METHODS),
        paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES),
        tax: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative'),
        notes: z.string().max(1000),
    })
    .refine(v => v.rentalDate >= todayInput(), { message: 'Cannot be in the past', path: ['rentalDate'] })
    .refine(v => v.dueDate >= v.rentalDate, { message: 'Must be on or after the rental date', path: ['dueDate'] });
type FormValues = z.infer<typeof schema>;

const ItemBanner = ({ item }: { item: InventoryItem }) => (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Scanned item</p>
            <p className="mt-0.5 truncate text-lg font-semibold">{item.itemName}</p>
            <p className="truncate text-sm text-muted-foreground">
                {[item.brand, item.itemModel].filter(Boolean).join(' · ')}{item.brand || item.itemModel ? ' · ' : ''}
                <span className="font-mono">{item.serialNumber}</span>
            </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <StatusBadge status={item.status} />
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(item.baseRentalPrice)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
        </div>
    </div>
);

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const customers = useCustomerOptions();
    const createRental = useCreateRental();
    const [stage, setStage] = useState<Stage>('scan');
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [looking, setLooking] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const defaults: FormValues = { customerId: '', rentalDate: todayInput(), dueDate: addDaysInput(todayInput(), 1), paymentMethod: 'Cash', paymentStatus: 'Pending', tax: 0, notes: '' };
    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });
    const values = useWatch({ control }) as FormValues;
    const days = Math.max(1, daysBetweenInputs(values.rentalDate, values.dueDate));
    const subtotal = days * (item?.baseRentalPrice ?? 0);
    const tax = Number.isFinite(values.tax) ? values.tax : 0;

    const lookup = async (code: string) => {
        setLooking(true);
        setScanError(null);
        try {
            const found = await fetchInventoryByQr(code);
            if (found.status !== 'Available') {
                setScanError(`${found.itemName} is currently ${found.status.toLowerCase()} and can't be rented.`);
                return;
            }
            setItem(found);
            setStage('details');
        } catch (err) {
            setScanError(getErrorCode(err) === 'QR_NOT_FOUND' ? `No inventory item matches "${code}".` : getErrorMessage(err));
        } finally {
            setLooking(false);
        }
    };

    // "Scan" from the inventory list passes the QR code along, so skip the camera.
    const prefill = (location.state as { prefillQR?: string } | null)?.prefillQR;
    const prefilled = useRef(false);
    useEffect(() => {
        if (prefill && !prefilled.current) {
            prefilled.current = true;
            void lookup(prefill);
            navigate(location.pathname, { replace: true, state: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefill]);

    const confirm = async () => {
        if (!item) return;
        setSaveError(null);
        try {
            const result = await createRental.mutateAsync({
                customerId: values.customerId,
                itemIds: [item._id],
                rentalDate: values.rentalDate,
                dueDate: values.dueDate,
                paymentStatus: values.paymentStatus,
                paymentMethod: values.paymentMethod,
                notes: values.notes || undefined,
                invoice: { paymentMethod: values.paymentMethod, paymentStatus: values.paymentStatus, tax, notes: values.notes || undefined },
            });
            setInvoice(result.invoice);
            setStage('done');
        } catch (err) {
            setSaveError(getErrorMessage(err));
        }
    };

    const restart = () => {
        setStage('scan');
        setItem(null);
        setInvoice(null);
        setSaveError(null);
        reset(defaults);
    };

    const customer = customers.data?.find(c => c._id === values.customerId) ?? null;
    const preview: InvoiceDocumentData | null = item ? {
        date: new Date().toISOString(),
        customer,
        lines: [{ description: `${item.itemName} (${item.serialNumber}) — rental`, quantity: days, unitPrice: item.baseRentalPrice, total: subtotal }],
        subtotal,
        tax,
        total: subtotal + tax,
        paymentMethod: values.paymentMethod,
        paymentStatus: values.paymentStatus,
        notes: values.notes || undefined,
        draft: true,
    } : null;

    return (
        <>
            <PageHeader
                title="QR Checkout"
                description="Scan an instrument, pick the customer and dates, and issue the invoice in one go."
                actions={<Button variant="outline" asChild><Link to="/admin/invoices"><ReceiptText /> All invoices</Link></Button>}
            />
            <Stepper steps={['Scan item', 'Rental details', 'Review', 'Done']} current={stage === 'done' ? STAGES.length : STAGES.indexOf(stage)} />

            {stage === 'scan' && (
                <ScanStep
                    icon={ScanLine}
                    title="Scan an instrument to rent it out"
                    description="Point the camera at the QR label. Tip: open Inventory → QR to show a code on screen."
                    onCode={lookup}
                    busy={looking}
                    error={scanError}
                />
            )}

            {stage === 'details' && item && (
                <Card className="mx-auto max-w-3xl p-5 sm:p-6">
                    <form className="space-y-5" onSubmit={handleSubmit(() => setStage('review'))} noValidate>
                        <ItemBanner item={item} />
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
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Rental date" required error={errors.rentalDate?.message}>
                                <Input type="date" min={todayInput()} {...register('rentalDate')} />
                            </Field>
                            <Field label="Return date" required error={errors.dueDate?.message}>
                                <Input type="date" min={values.rentalDate} {...register('dueDate')} />
                            </Field>
                            <Field label="Payment method">
                                <NativeSelect {...register('paymentMethod')}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</NativeSelect>
                            </Field>
                            <Field label="Payment status">
                                <NativeSelect {...register('paymentStatus')}>{SIMPLE_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</NativeSelect>
                            </Field>
                            <Field label="Tax / other charges" error={errors.tax?.message}>
                                <Input type="number" inputMode="decimal" min={0} step="0.01" leading={<span className="text-xs">Rs.</span>} {...register('tax', { valueAsNumber: true })} />
                            </Field>
                        </div>
                        <Field label="Notes"><Textarea rows={2} placeholder="Optional" {...register('notes')} /></Field>
                        <div className="rounded-xl bg-primary/8 p-4 text-sm tabular-nums">
                            <div className="flex justify-between text-muted-foreground"><span>{days} day{days === 1 ? '' : 's'} × {formatCurrency(item.baseRentalPrice)}</span><span>{formatCurrency(subtotal)}</span></div>
                            {tax > 0 && <div className="mt-1 flex justify-between text-muted-foreground"><span>Tax / other</span><span>{formatCurrency(tax)}</span></div>}
                            <div className="mt-2 flex justify-between border-t border-primary/15 pt-2 text-base font-semibold"><span>Total</span><span>{formatCurrency(subtotal + tax)}</span></div>
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={restart}><ArrowLeft /> Scan a different item</Button>
                            <Button type="submit">Review invoice <ArrowRight /></Button>
                        </div>
                    </form>
                </Card>
            )}

            {stage === 'review' && preview && (
                <div className="mx-auto max-w-3xl space-y-5">
                    <InvoiceDocument data={preview} />
                    <FormError message={saveError} />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button variant="outline" onClick={() => setStage('details')} disabled={createRental.isPending}><ArrowLeft /> Edit details</Button>
                        <Button size="lg" onClick={confirm} loading={createRental.isPending}>Confirm rental & save invoice</Button>
                    </div>
                </div>
            )}

            {stage === 'done' && invoice && (
                <div className="mx-auto max-w-3xl space-y-5">
                    <Card className="flex flex-col gap-4 border-emerald-500/30 bg-emerald-500/5 p-5 sm:flex-row sm:items-center">
                        <CircleCheckBig className="size-10 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <div className="flex-1">
                            <p className="font-semibold">Rental created</p>
                            <p className="text-sm text-muted-foreground">Invoice {invoice.invoiceId} · {formatCurrency(invoice.totalAmount)}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
                            <Button onClick={restart}><ScanLine /> Scan next item</Button>
                        </div>
                    </Card>
                    <InvoiceDocument data={invoiceToDocument(invoice)} />
                    <PrintPortal><InvoiceDocument data={invoiceToDocument(invoice)} /></PrintPortal>
                </div>
            )}
        </>
    );
};

export default CheckoutPage;
