import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateStudioBooking, useStudioRooms, useUpdateStudioBooking } from '@/api/studio';
import { getErrorMessage } from '@/lib/api';
import { SIMPLE_PAYMENT_STATUSES, STUDIO_STATUSES } from '@/lib/constants';
import { dateTimeInputToISO, toDateTimeInput } from '@/lib/format';
import type { StudioBooking } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { useCustomerOptions } from '@/features/shared/options';

const MAX_HOURS = 24;

const schema = z
    .object({
        customerId: z.string().min(1, 'Choose a customer'),
        roomName: z.string().min(1, 'Choose a room'),
        startTime: z.string().min(1, 'Choose a start time'),
        endTime: z.string().min(1, 'Choose an end time'),
        totalAmount: z.number({ error: 'Enter an amount' }).min(0, 'Cannot be negative'),
        status: z.enum(STUDIO_STATUSES),
        paymentStatus: z.enum(SIMPLE_PAYMENT_STATUSES),
        notes: z.string().max(1000),
    })
    .refine(v => !v.startTime || !v.endTime || new Date(v.endTime) > new Date(v.startTime), { message: 'Must be after the start time', path: ['endTime'] })
    .refine(v => !v.startTime || !v.endTime || new Date(v.endTime).getTime() - new Date(v.startTime).getTime() <= MAX_HOURS * 3_600_000, {
        message: `A booking can be at most ${MAX_HOURS} hours`,
        path: ['endTime'],
    });
type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    booking: StudioBooking | null;
    onOpenChange: (open: boolean) => void;
}

export const BookingDialog = ({ open, booking, onOpenChange }: Props) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">
            {open && <BookingForm key={booking?._id ?? 'new'} booking={booking} onClose={() => onOpenChange(false)} />}
        </DialogContent>
    </Dialog>
);

const BookingForm = ({ booking, onClose }: { booking: StudioBooking | null; onClose: () => void }) => {
    const customers = useCustomerOptions();
    const rooms = useStudioRooms();
    const create = useCreateStudioBooking();
    const update = useUpdateStudioBooking();
    const [error, setError] = useState<string | null>(null);

    const { control, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: booking
            ? {
                customerId: booking.customer?._id ?? '', roomName: booking.roomName, startTime: toDateTimeInput(booking.startTime),
                endTime: toDateTimeInput(booking.endTime), totalAmount: booking.totalAmount, status: booking.status,
                paymentStatus: booking.paymentStatus, notes: booking.notes ?? '',
            }
            : { customerId: '', roomName: rooms.data?.[0] ?? 'Studio A', startTime: '', endTime: '', totalAmount: 0, status: 'Confirmed', paymentStatus: 'Pending', notes: '' },
    });

    const [start, end] = useWatch({ control, name: ['startTime', 'endTime'] });
    const hours = start && end ? (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000 : 0;

    const onSubmit = async (values: FormValues) => {
        setError(null);
        const body = { ...values, startTime: dateTimeInputToISO(values.startTime), endTime: dateTimeInputToISO(values.endTime), notes: values.notes || undefined };
        try {
            const saved = booking ? await update.mutateAsync({ id: booking._id, ...body }) : await create.mutateAsync(body);
            toast.success(booking ? `Booking ${saved.bookingId} updated` : `Booking ${saved.bookingId} confirmed`);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
                <DialogTitle>{booking ? `Edit booking ${booking.bookingId}` : 'New studio booking'}</DialogTitle>
                <DialogDescription>Times are in your local time. Overlapping bookings for the same room are rejected.</DialogDescription>
            </DialogHeader>
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
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Room" required error={errors.roomName?.message}>
                        <NativeSelect {...register('roomName')}>{(rooms.data ?? []).map(r => <option key={r}>{r}</option>)}</NativeSelect>
                    </Field>
                    <Field label="Total amount" required error={errors.totalAmount?.message}>
                        <Input type="number" inputMode="decimal" min={0} step="0.01" leading={<span className="text-xs">Rs.</span>} {...register('totalAmount', { valueAsNumber: true })} />
                    </Field>
                    <Field label="Starts" required error={errors.startTime?.message}>
                        <Input type="datetime-local" {...register('startTime')} />
                    </Field>
                    <Field label="Ends" required error={errors.endTime?.message} hint={hours > 0 ? `${Math.round(hours * 100) / 100} hour${hours === 1 ? '' : 's'}` : undefined}>
                        <Input type="datetime-local" min={start || undefined} {...register('endTime')} />
                    </Field>
                    <Field label="Status">
                        <NativeSelect {...register('status')}>{STUDIO_STATUSES.map(s => <option key={s}>{s}</option>)}</NativeSelect>
                    </Field>
                    <Field label="Payment status">
                        <NativeSelect {...register('paymentStatus')}>{SIMPLE_PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</NativeSelect>
                    </Field>
                </div>
                <Field label="Notes"><Textarea rows={2} placeholder="Optional — engineer, equipment, etc." {...register('notes')} /></Field>
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{booking ? 'Save changes' : 'Create booking'}</Button>
            </DialogFooter>
        </form>
    );
};
