import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Check, KeyRound } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { AuthUser } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FormError } from '@/components/ui/field';
import { Brand } from '@/components/layout/brand';

const RULES = [
    { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { label: 'Contains a letter', test: (v: string) => /[A-Za-z]/.test(v) },
    { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
];

const schema = z
    .object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(8, 'Use at least 8 characters').regex(/[A-Za-z]/, 'Add a letter').regex(/\d/, 'Add a number'),
        confirmPassword: z.string(),
    })
    .refine(v => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })
    .refine(v => v.newPassword !== v.currentPassword, { message: 'Choose a different password', path: ['newPassword'] });
type FormValues = z.infer<typeof schema>;

const ChangePasswordPage = () => {
    useDocumentTitle('Change password');
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const forced = Boolean(user?.mustChangePassword);
    const [error, setError] = useState<string | null>(null);

    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });
    const newPassword = useWatch({ control, name: 'newPassword' });

    const onSubmit = async ({ currentPassword, newPassword: next }: FormValues) => {
        setError(null);
        try {
            const { data } = await api.patch<{ user: AuthUser }>('/auth/password', { currentPassword, newPassword: next });
            setUser(data.user);
            toast.success('Password updated');
            navigate('/admin', { replace: true });
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    return (
        <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-8 flex justify-center"><Brand /></div>
                <Card className="p-6 sm:p-8">
                    <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="size-6" /></span>
                    <h1 className="text-xl font-semibold tracking-tight">{forced ? 'Choose your own password' : 'Change password'}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {forced
                            ? 'Your account uses a temporary password. Set a personal one to continue.'
                            : 'You will stay signed in here; other devices will be signed out.'}
                    </p>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <FormError message={error} />
                        <Field label={forced ? 'Temporary password' : 'Current password'} error={errors.currentPassword?.message}>
                            <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
                        </Field>
                        <Field label="New password" error={errors.newPassword?.message}>
                            <Input type="password" autoComplete="new-password" {...register('newPassword')} />
                        </Field>
                        <ul className="grid gap-1.5 text-xs" aria-label="Password requirements">
                            {RULES.map(rule => {
                                const ok = rule.test(newPassword ?? '');
                                return (
                                    <li key={rule.label} className={cn('flex items-center gap-2', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                                        <Check className={cn('size-3.5', !ok && 'opacity-30')} aria-hidden />
                                        {rule.label}
                                        <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
                            <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
                        </Field>
                        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Update password</Button>
                    </form>
                </Card>
                <div className="mt-6 flex justify-center">
                    {forced ? (
                        <Button variant="link" onClick={() => void logout().then(() => navigate('/login', { replace: true }))}>Sign out instead</Button>
                    ) : (
                        <Button variant="link" asChild><Link to="/admin"><ArrowLeft /> Back to the app</Link></Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
