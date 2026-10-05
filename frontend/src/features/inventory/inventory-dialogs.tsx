import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download, Printer, ScanLine } from 'lucide-react';
import { useCreateInventoryItem, useUpdateInventoryItem } from '@/api/inventory';
import { getErrorMessage } from '@/lib/api';
import { INVENTORY_CATEGORIES, MANUAL_INVENTORY_STATUSES } from '@/lib/constants';
import { calendarToInput, formatCurrency } from '@/lib/format';
import type { InventoryItem } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Detail, PrintPortal } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';

/* ── Add / edit ─────────────────────────────────────────────────────────── */

const schema = z.object({
    itemName: z.string().trim().min(1, 'Required').max(100),
    category: z.enum(INVENTORY_CATEGORIES),
    brand: z.string().trim().max(60),
    itemModel: z.string().trim().max(60),
    serialNumber: z.string().trim().min(1, 'Required').max(60),
    status: z.enum(MANUAL_INVENTORY_STATUSES),
    baseRentalPrice: z.number({ error: 'Enter a daily rate' }).min(0, 'Cannot be negative'),
    purchaseDate: z.string(),
    notes: z.string().trim().max(500),
});
type FormValues = z.infer<typeof schema>;

export const ItemDialog = ({ open, item, onOpenChange }: { open: boolean; item: InventoryItem | null; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">{open && <ItemForm key={item?._id ?? 'new'} item={item} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
);

const ItemForm = ({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) => {
    const create = useCreateInventoryItem();
    const update = useUpdateInventoryItem();
    const [error, setError] = useState<string | null>(null);
    const isRented = item?.status === 'Rented';

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            itemName: item?.itemName ?? '',
            category: item?.category ?? 'Instruments',
            brand: item?.brand ?? '',
            itemModel: item?.itemModel ?? '',
            serialNumber: item?.serialNumber ?? '',
            status: item && item.status !== 'Rented' ? item.status : 'Available',
            baseRentalPrice: item?.baseRentalPrice ?? 0,
            purchaseDate: calendarToInput(item?.purchaseDate),
            notes: item?.notes ?? '',
        },
    });

    const onSubmit = async ({ serialNumber, status, ...values }: FormValues) => {
        setError(null);
        try {
            if (item) {
                // A rented item's status is owned by the rental workflow.
                await update.mutateAsync({ id: item._id, ...values, ...(isRented ? {} : { status }) });
                toast.success(`${values.itemName} updated`);
            } else {
                const created = await create.mutateAsync({ ...values, serialNumber, status });
                toast.success(`${created.itemName} added`, { description: `QR code ${created.qrCodeId}` });
            }
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
                <DialogTitle>{item ? 'Edit item' : 'Add inventory item'}</DialogTitle>
                <DialogDescription>{item ? `Serial ${item.serialNumber}` : 'A unique QR code is generated when you save.'}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
                <FormError message={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Item name" required error={errors.itemName?.message} className="sm:col-span-2">
                        <Input placeholder="e.g. Fender Stratocaster" {...register('itemName')} />
                    </Field>
                    <Field label="Category" required>
                        <NativeSelect {...register('category')}>{INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</NativeSelect>
                    </Field>
                    <Field label="Daily rate" required error={errors.baseRentalPrice?.message}>
                        <Input type="number" inputMode="decimal" min={0} step="0.01" leading={<span className="text-xs">Rs.</span>} {...register('baseRentalPrice', { valueAsNumber: true })} />
                    </Field>
                    <Field label="Brand" error={errors.brand?.message}><Input {...register('brand')} /></Field>
                    <Field label="Model" error={errors.itemModel?.message}><Input {...register('itemModel')} /></Field>
                    <Field label="Serial number" required error={errors.serialNumber?.message} hint={item ? 'Serial numbers cannot be changed' : undefined}>
                        <Input className="font-mono" disabled={!!item} {...register('serialNumber')} />
                    </Field>
                    <Field label="Status" hint={isRented ? 'Out on rental — changes when it is returned' : undefined}>
                        <NativeSelect disabled={isRented} {...register('status')}>
                            {isRented && <option>Rented</option>}
                            {MANUAL_INVENTORY_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </NativeSelect>
                    </Field>
                    <Field label="Purchase date"><Input type="date" {...register('purchaseDate')} /></Field>
                </div>
                <Field label="Notes" error={errors.notes?.message}>
                    <Textarea rows={2} placeholder="Condition, accessories included, etc." {...register('notes')} />
                </Field>
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{item ? 'Save changes' : 'Add item'}</Button>
            </DialogFooter>
        </form>
    );
};

/* ── QR code ────────────────────────────────────────────────────────────── */

/** The QR code is generated in the browser; no item data is sent to a third-party service. */
export const QrDialog = ({ item, onOpenChange }: { item: InventoryItem | null; onOpenChange: (open: boolean) => void }) => {
    const navigate = useNavigate();
    const canvasWrap = useRef<HTMLDivElement>(null);

    const download = () => {
        const canvas = canvasWrap.current?.querySelector('canvas');
        if (!canvas || !item) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `QR_${item.serialNumber}.png`;
        link.click();
    };

    return (
        <Dialog open={item !== null} onOpenChange={onOpenChange}>
            <DialogContent size="sm">
                {item && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{item.itemName}</DialogTitle>
                            <DialogDescription>Stick this label on the item. Scanning it opens checkout or return.</DialogDescription>
                        </DialogHeader>
                        <DialogBody className="space-y-4">
                            <div ref={canvasWrap} className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                                <QRCodeCanvas value={item.qrCodeId} size={240} level="M" marginSize={1} />
                                <p className="mt-2 text-center font-mono text-sm font-semibold tracking-wider text-zinc-900">{item.qrCodeId}</p>
                            </div>
                            <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4">
                                <Detail label="Serial">{item.serialNumber}</Detail>
                                <Detail label="Daily rate">{formatCurrency(item.baseRentalPrice)}</Detail>
                                <Detail label="Category">{item.category}</Detail>
                                <Detail label="Status"><StatusBadge status={item.status} /></Detail>
                            </dl>
                            <PrintPortal>
                                <div className="flex flex-col items-center gap-2 pt-8 text-black">
                                    <QRCodeSVG value={item.qrCodeId} size={220} level="M" marginSize={1} />
                                    <p className="font-mono text-base font-bold tracking-wider">{item.qrCodeId}</p>
                                    <p className="text-sm">{item.itemName} · {item.serialNumber}</p>
                                    <p className="text-xs">ELVI Music Studio</p>
                                </div>
                            </PrintPortal>
                        </DialogBody>
                        <DialogFooter className="sm:justify-between">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button variant="outline" onClick={download}><Download /> PNG</Button>
                                <Button variant="outline" onClick={() => window.print()}><Printer /> Print label</Button>
                            </div>
                            {item.status === 'Available' && (
                                <Button onClick={() => { onOpenChange(false); navigate('/admin/scanner', { state: { prefillQR: item.qrCodeId } }); }}>
                                    <ScanLine /> Rent this item
                                </Button>
                            )}
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
