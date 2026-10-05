import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BellRing, KeyRound, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme, type Theme } from '@/providers/theme-provider';
import { useTriggerReminders } from '@/api/stats';
import { getErrorMessage } from '@/lib/api';
import { initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/menus';
import { Tooltip } from '@/components/ui/menus';
import { ConfirmDialog } from '@/components/data/confirm-dialog';

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

export const ThemeToggle = () => {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    return (
        <Tooltip content={`Theme: ${THEMES.find(t => t.value === theme)?.label}`}>
            <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`}>
                {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
            </Button>
        </Tooltip>
    );
};

export const UserMenu = () => {
    const { user, isAdmin, isDemo, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const reminders = useTriggerReminders();
    const [confirmReminders, setConfirmReminders] = useState(false);

    const signOut = async () => {
        await logout().catch(() => undefined);
        navigate('/login', { replace: true });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-2.5 rounded-xl p-1 pr-1 transition-colors hover:bg-accent sm:pr-2.5"
                        aria-label="Account menu"
                    >
                        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
                            {initials(user?.name)}
                        </span>
                        <span className="hidden text-left leading-tight sm:block">
                            <span className="block max-w-32 truncate text-sm font-medium">{user?.name}</span>
                            <span className="block text-xs text-muted-foreground">{user?.role}</span>
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60">
                    <DropdownMenuLabel>
                        <div className="truncate text-sm font-medium text-foreground">{user?.name}</div>
                        <div className="truncate font-normal">@{user?.username}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                    <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                        {THEMES.map(t => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setTheme(t.value)}
                                aria-pressed={theme === t.value}
                                className="flex flex-col items-center gap-1 rounded-lg border border-transparent py-2 text-xs text-muted-foreground transition-colors hover:bg-accent aria-pressed:border-primary/30 aria-pressed:bg-primary/10 aria-pressed:text-primary"
                            >
                                <t.icon className="size-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <DropdownMenuSeparator />
                    {!isDemo && <DropdownMenuItem icon={<KeyRound />} onSelect={() => navigate('/change-password')}>Change password</DropdownMenuItem>}
                    {isAdmin && (
                        <DropdownMenuItem icon={<BellRing />} onSelect={() => setConfirmReminders(true)}>Send due-date reminders</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem icon={<LogOut />} destructive onSelect={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={confirmReminders}
                onOpenChange={setConfirmReminders}
                title="Send due-date reminders now?"
                description="Customers with rentals due tomorrow, due today or one day overdue get an SMS and email. Anyone already reminded today is skipped."
                confirmLabel="Send reminders"
                onConfirm={async () => {
                    try {
                        const result = await reminders.mutateAsync();
                        toast.success(result.message);
                    } catch (error) {
                        throw new Error(getErrorMessage(error));
                    }
                }}
            />
        </>
    );
};
