import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarCheck, Eye, EyeOff, LockKeyhole, ReceiptText, ScanLine, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { getErrorMessage } from '@/lib/api';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FormError } from '@/components/ui/field';
import { Brand, BrandMark } from '@/components/layout/brand';
import { ThemeToggle } from '@/components/layout/user-menu';

const schema = z.object({
    username: z.string().trim().min(1, 'Enter your username'),
    password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

const FEATURES = [
    { icon: ScanLine, title: 'QR checkout & returns', text: 'Scan an instrument to rent it out or check it back in, with late fees worked out for you.' },
    { icon: CalendarCheck, title: 'Studio bookings', text: 'Room schedules that can never be double-booked.' },
    { icon: ReceiptText, title: 'Invoices & insights', text: 'Printable invoices, payments and revenue trends in one place.' },
];

// Optional one-click access to the read-only demo account (set both variables on a showcase deployment).
const DEMO_LOGIN = import.meta.env.VITE_DEMO_USERNAME && import.meta.env.VITE_DEMO_PASSWORD
    ? { username: import.meta.env.VITE_DEMO_USERNAME, password: import.meta.env.VITE_DEMO_PASSWORD }
    : null;

// Decorative waveform heights for the brand panel.
const WAVE = [28, 46, 64, 38, 80, 56, 92, 70, 44, 86, 60, 34, 72, 50, 88, 40, 66, 30, 58, 76];

const LoginPage = () => {
    useDocumentTitle('Sign in');
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? '/admin/products';
    const [showPassword, setShowPassword] = useState(false);
    const [capsLock, setCapsLock] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [demoLoading, setDemoLoading] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

    if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : from} replace />;

    const onSubmit = async (values: FormValues) => {
        setError(null);
        try {
            const signedIn = await login(values.username, values.password);
            navigate(signedIn.mustChangePassword ? '/change-password' : from, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, 'Sign in failed. Please try again.'));
        }
    };

    const exploreDemo = async () => {
        if (!DEMO_LOGIN) return;
        setError(null);
        setDemoLoading(true);
        try {
            await login(DEMO_LOGIN.username, DEMO_LOGIN.password);
            navigate('/admin/products', { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, 'The demo is unavailable right now. Please try again shortly.'));
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col">
                <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden />
                <div className="relative flex items-center gap-3">
                    <BrandMark className="bg-white/15 shadow-none ring-1 ring-white/25 backdrop-blur" />
                    <span className="text-lg font-semibold tracking-tight">ELVI Music Studio</span>
                </div>
                <div className="relative mt-auto max-w-md">
                    <h2 className="text-4xl font-semibold leading-tight tracking-tight">Run your studio in perfect tune.</h2>
                    <p className="mt-4 text-white/75">Rentals, bookings and billing for your team — on the shop counter or on your phone.</p>
                    <ul className="mt-10 space-y-5">
                        {FEATURES.map(f => (
                            <li key={f.title} className="flex gap-4">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20"><f.icon className="size-5" /></span>
                                <div>
                                    <p className="font-medium">{f.title}</p>
                                    <p className="text-sm text-white/70">{f.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative mt-12 flex h-24 items-end gap-1.5 opacity-40" aria-hidden>
                    {WAVE.map((h, i) => <span key={i} className="w-full rounded-full bg-white" style={{ height: `${h}%` }} />)}
                </div>
            </section>

            {/* Sign-in form */}
            <section className="relative flex flex-col px-6 py-8 sm:px-10">
                <div className="flex items-center justify-between">
                    <div className="lg:hidden"><Brand /></div>
                    <div className="ml-auto"><ThemeToggle /></div>
                </div>
                <div className="m-auto w-full max-w-sm py-10">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Sign in with your staff account to continue.</p>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <FormError message={error} />
                        <Field label="Username" error={errors.username?.message}>
                            <Input
                                autoComplete="username"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                autoFocus
                                leading={<User />}
                                placeholder="e.g. kamal"
                                {...register('username')}
                            />
                        </Field>
                        <Field label="Password" error={errors.password?.message} hint={capsLock ? 'Caps Lock is on' : undefined}>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                leading={<LockKeyhole />}
                                placeholder="••••••••"
                                onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))}
                                trailing={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(s => !s)}
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                }
                                {...register('password')}
                            />
                        </Field>
                        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                            {isSubmitting ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                    {DEMO_LOGIN && (
                        <div>
                            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
                                <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
                            </div>
                            <Button variant="outline" size="lg" className="w-full" onClick={exploreDemo} loading={demoLoading} disabled={isSubmitting}>
                                {!demoLoading && <Sparkles />} Explore the demo
                            </Button>
                            <p className="mt-2 text-center text-xs text-muted-foreground">
                                Read-only access, no account needed. The first visit can take up to a minute while the server wakes up.
                            </p>
                        </div>
                    )}
                    <p className="mt-8 text-center text-xs text-muted-foreground">Forgot your password? Ask an administrator to send you new sign-in details.</p>
                </div>
                <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} ELVI Music Studio</p>
            </section>
        </div>
    );
};

export default LoginPage;
