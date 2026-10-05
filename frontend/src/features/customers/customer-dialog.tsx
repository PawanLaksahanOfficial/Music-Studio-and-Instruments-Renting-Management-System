import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateCustomer, useUpdateCustomer } from '@/api/customers';
import { getErrorMessage } from '@/lib/api';
import type { Customer } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const schema = z.object({
    firstName: z.string().trim().min(1, 'Required').max(60),
    lastName: z.string().trim().min(1, 'Required').max(60),
    phone: z.string().trim().min(7, 'Too short').max(20, 'Too long').regex(/^\+?[\d\s()-]+$/, 'Digits, spaces, + and - only'),
    email: z.union([z.literal(''), z.email('Enter a valid email')]),
    nicOrPassport: z.string().trim().min(5, 'Too short').max(20, 'Too long').regex(/^[A-Za-z0-9-]+$/, 'Letters, numbers and dashes only'),
    address: z.string().trim().max(200),
});
type FormValues = z.infer<typeof schema>;

export const CustomerDialog = ({ open, customer, onOpenChange }: { open: boolean; customer: Customer | null; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="lg">{open && <CustomerForm key={customer?._id ?? 'new'} customer={customer} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
);

const CustomerForm = ({ customer, onClose }: { customer: Customer | null; onClose: () => void }) => {
    const create = useCreateCustomer();
    const update = useUpdateCustomer();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: customer?.firstName ?? '',
            lastName: customer?.lastName ?? '',
            phone: customer?.phone ?? '',
            email: customer?.email ?? '',
            nicOrPassport: customer?.nicOrPassport ?? '',
            address: customer?.address ?? '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        setError(null);
        try {
            if (customer) {
                await update.mutateAsync({ id: customer._id, ...values });
                toast.success('Customer updated');
            } else {
                await create.mutateAsync({ ...values, email: values.email || undefined, address: values.address || undefined });
                toast.success(`${values.firstName} ${values.lastName} added`);
            }
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
                <DialogTitle>{customer ? 'Edit customer' : 'New customer'}</DialogTitle>
                <DialogDescription>An NIC or passport number is required for rentals.</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
                <FormError message={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" required error={errors.firstName?.message}><Input autoComplete="off" {...register('firstName')} /></Field>
                    <Field label="Last name" required error={errors.lastName?.message}><Input autoComplete="off" {...register('lastName')} /></Field>
                    <Field label="Phone" required error={errors.phone?.message}><Input type="tel" inputMode="tel" placeholder="077 123 4567" {...register('phone')} /></Field>
                    <Field label="Email" error={errors.email?.message}><Input type="email" inputMode="email" placeholder="Optional" {...register('email')} /></Field>
                    <Field label="NIC / passport" required error={errors.nicOrPassport?.message}>
                        <Input className="font-mono uppercase" autoCapitalize="characters" {...register('nicOrPassport')} />
                    </Field>
                    <Field label="Address" error={errors.address?.message}><Input placeholder="Optional" {...register('address')} /></Field>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{customer ? 'Save changes' : 'Add customer'}</Button>
            </DialogFooter>
        </form>
    );
};
