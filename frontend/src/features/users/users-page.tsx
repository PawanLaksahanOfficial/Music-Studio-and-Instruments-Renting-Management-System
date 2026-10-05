import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createColumnHelper } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Info, Pencil, Power, PowerOff, Send, Trash2, UserCog, UserPlus } from 'lucide-react';
import { useCreateUser, useDeleteUser, useSendLoginDetails, useToggleUserActive, useUpdateUser, useUsers } from '@/api/users';
import { getErrorMessage } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import { initials } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import type { User } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FormError } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { DataTable, MobileCard } from '@/components/data/data-table';
import { Detail, PageHeader } from '@/components/data/page';
import { StatusBadge } from '@/components/data/status-badge';
import { RowActions, type RowAction } from '@/components/data/row-actions';
import { ConfirmDialog } from '@/components/data/confirm-dialog';
import { useConfirm } from '@/hooks/use-confirm';

const passwordRule = z.string().min(8, 'Use at least 8 characters').regex(/[A-Za-z]/, 'Add a letter').regex(/\d/, 'Add a number');

const schema = (isNew: boolean) => z.object({
    name: z.string().trim().min(1, 'Required').max(80),
    username: isNew
        ? z.string().trim().toLowerCase().min(3, 'At least 3 characters').max(40).regex(/^[a-z0-9._-]+$/, 'Letters, numbers, dots, dashes and underscores')
        : z.string(),
    email: z.union([z.literal(''), z.email('Enter a valid email')]),
    role: z.enum(ROLES),
    password: isNew ? passwordRule : z.union([z.literal(''), passwordRule]),
});
type FormValues = z.infer<ReturnType<typeof schema>>;

const UserDialog = ({ open, user, onOpenChange }: { open: boolean; user: User | null; onOpenChange: (open: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">{open && <UserForm key={user?._id ?? 'new'} user={user} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
);

const UserForm = ({ user, onClose }: { user: User | null; onClose: () => void }) => {
    const { user: me } = useAuth();
    const create = useCreateUser();
    const update = useUpdateUser();
    const [error, setError] = useState<string | null>(null);
    const isSelf = user?._id === me?._id;

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema(!user)),
        defaultValues: { name: user?.name ?? '', username: user?.username ?? '', email: user?.email ?? '', role: user?.role ?? 'Cashier', password: '' },
    });

    const onSubmit = async (values: FormValues) => {
        setError(null);
        try {
            if (user) {
                await update.mutateAsync({
                    id: user._id,
                    name: values.name,
                    email: values.email,
                    ...(isSelf ? {} : { role: values.role }),
                    ...(values.password ? { password: values.password } : {}),
                });
                toast.success(`${values.name} updated`);
            } else {
                await create.mutateAsync({ ...values, email: values.email || undefined });
                toast.success(`${values.name} can now sign in`, { description: 'They will be asked to choose their own password.' });
            }
            onClose();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
                <DialogTitle>{user ? `Edit ${user.name}` : 'New staff user'}</DialogTitle>
                <DialogDescription>{user ? `@${user.username}` : 'Cashiers run rentals and invoices; admins also manage inventory, customers, staff and reports.'}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
                <FormError message={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required error={errors.name?.message}><Input {...register('name')} /></Field>
                    {!user && (
                        <Field label="Username" required error={errors.username?.message}>
                            <Input autoCapitalize="none" autoCorrect="off" spellCheck={false} {...register('username')} />
                        </Field>
                    )}
                    <Field label="Email" error={errors.email?.message} hint="Needed to email sign-in details"><Input type="email" {...register('email')} /></Field>
                    <Field label="Role" hint={isSelf ? "You can't change your own role" : undefined}>
                        <NativeSelect disabled={isSelf} {...register('role')}>{ROLES.map(r => <option key={r}>{r}</option>)}</NativeSelect>
                    </Field>
                    {!isSelf && (
                        <Field
                            label={user ? 'New password' : 'Temporary password'}
                            required={!user}
                            error={errors.password?.message}
                            hint={user ? 'Leave empty to keep the current password' : 'At least 8 characters with a letter and a number'}
                            className="sm:col-span-2"
                        >
                            <Input type="password" autoComplete="new-password" {...register('password')} />
                        </Field>
                    )}
                </div>
                {isSelf ? (
                    <p className="flex gap-2 rounded-xl bg-primary/8 p-3 text-sm text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>To change your own password, use <Link to="/change-password" className="font-medium text-primary hover:underline">Change password</Link>.</span>
                    </p>
                ) : (
                    <p className="flex gap-2 rounded-xl bg-primary/8 p-3 text-sm text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        Passwords you set here are temporary — the user must choose their own at the next sign-in.
                    </p>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={create.isPending || update.isPending}>{user ? 'Save changes' : 'Create user'}</Button>
            </DialogFooter>
        </form>
    );
};

const column = createColumnHelper<User>();

const UsersPage = () => {
    const { user: me } = useAuth();
    const users = useUsers();
    const toggleActive = useToggleUserActive();
    const deleteUser = useDeleteUser();
    const sendDetails = useSendLoginDetails();
    const [dialog, setDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const sendConfirm = useConfirm<User>();
    const deactivateConfirm = useConfirm<User>();
    const deleteConfirm = useConfirm<User>();

    const activate = async (u: User) => {
        try {
            await toggleActive.mutateAsync(u._id);
            toast.success(`${u.name} activated`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const actionsFor = (u: User): RowAction[] => {
        const isSelf = u._id === me?._id;
        return [
            { label: 'Edit', icon: <Pencil />, onSelect: () => setDialog({ open: true, user: u }) },
            { label: 'Email new sign-in details', icon: <Send />, onSelect: () => sendConfirm.open(u), hidden: isSelf || !u.email || !u.isActive },
            { label: 'Activate', icon: <Power />, onSelect: () => activate(u), hidden: u.isActive },
            { label: 'Deactivate', icon: <PowerOff />, onSelect: () => deactivateConfirm.open(u), destructive: true, hidden: isSelf || !u.isActive },
            { label: 'Delete', icon: <Trash2 />, onSelect: () => deleteConfirm.open(u), destructive: true, hidden: isSelf },
        ];
    };

    const columns = [
        column.accessor('name', {
            header: 'User',
            cell: info => {
                const u = info.row.original;
                return (
                    <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 font-medium">{u.name}{u._id === me?._id && <Badge tone="primary">You</Badge>}</div>
                            <div className="truncate text-xs text-muted-foreground">@{u.username}{u.email ? ` · ${u.email}` : ''}</div>
                        </div>
                    </div>
                );
            },
        }),
        column.accessor('role', { header: 'Role', cell: info => <StatusBadge status={info.getValue()} /> }),
        column.accessor(u => (u.isActive ? 'Active' : 'Inactive'), {
            id: 'status',
            header: 'Status',
            cell: info => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={info.getValue()} />
                    {info.row.original.mustChangePassword && <Badge tone="warning">Temporary password</Badge>}
                </div>
            ),
        }),
        column.accessor('lastLogin', { header: 'Last sign-in', cell: info => <span className="text-muted-foreground">{info.getValue() ? formatRelative(info.getValue()) : 'Never'}</span> }),
        column.display({ id: 'actions', header: () => <span className="sr-only">Actions</span>, meta: { align: 'right' }, cell: info => <RowActions actions={actionsFor(info.row.original)} /> }),
    ];

    return (
        <>
            <PageHeader
                title="Staff Users"
                description="Manage who can sign in, and whether they are a cashier or an admin."
                actions={<Button onClick={() => setDialog({ open: true, user: null })}><UserPlus /> New user</Button>}
            />

            <DataTable
                data={users.data}
                columns={columns}
                getRowId={u => u._id}
                isLoading={users.isLoading}
                error={users.error}
                onRetry={() => users.refetch()}
                searchText={u => `${u.name} ${u.username} ${u.email ?? ''} ${u.role}`}
                searchPlaceholder="Search staff"
                empty={{ icon: UserCog, title: 'No staff users', description: 'Add cashiers and admins who can sign in.' }}
                renderCard={u => (
                    <MobileCard
                        title={<span className="flex items-center gap-2">{u.name}{u._id === me?._id && <Badge tone="primary">You</Badge>}</span>}
                        subtitle={`@${u.username}`}
                        badge={<StatusBadge status={u.role} />}
                        actions={<RowActions actions={actionsFor(u)} />}
                    >
                        <Detail label="Status"><StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /></Detail>
                        <Detail label="Last sign-in">{u.lastLogin ? formatRelative(u.lastLogin) : 'Never'}</Detail>
                    </MobileCard>
                )}
            />

            <UserDialog open={dialog.open} user={dialog.user} onOpenChange={open => !open && setDialog({ open: false, user: null })} />
            <ConfirmDialog
                {...sendConfirm.dialogProps}
                title={`Email new sign-in details to ${sendConfirm.target?.name}?`}
                description={`A new temporary password will be emailed to ${sendConfirm.target?.email}. Their current password stops working and they'll be signed out everywhere.`}
                confirmLabel="Send email"
                onConfirm={async () => {
                    const result = await sendDetails.mutateAsync(sendConfirm.target!._id);
                    toast.success(result.message);
                }}
            />
            <ConfirmDialog
                {...deactivateConfirm.dialogProps}
                tone="destructive"
                title={`Deactivate ${deactivateConfirm.target?.name}?`}
                description="They are signed out immediately and can't sign in until reactivated."
                confirmLabel="Deactivate"
                successMessage="User deactivated"
                onConfirm={() => toggleActive.mutateAsync(deactivateConfirm.target!._id)}
            />
            <ConfirmDialog
                {...deleteConfirm.dialogProps}
                tone="destructive"
                title={`Delete ${deleteConfirm.target?.name}?`}
                description="This permanently removes the account. Users who issued invoices are kept for the audit trail — deactivate them instead."
                confirmLabel="Delete permanently"
                successMessage="User deleted"
                onConfirm={() => deleteUser.mutateAsync(deleteConfirm.target!._id)}
            />
        </>
    );
};

export default UsersPage;
