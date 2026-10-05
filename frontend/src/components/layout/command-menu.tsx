import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { CalendarPlus, LogOut, Moon, PackagePlus, Plus, Search, Sun, UserPlus } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { Kbd } from '@/components/ui/card';
import { visibleGroups } from './nav';

interface Action {
    label: string;
    icon: typeof Plus;
    run: () => void;
    keywords?: string[];
    adminOnly?: boolean;
}

const itemClass =
    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground';
const groupClass = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground';

/** ⌘K / Ctrl+K palette: jump to any page or start a common task. */
export const CommandMenu = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const navigate = useNavigate();
    const { canViewAdmin, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onOpenChange]);

    const go = (path: string) => {
        onOpenChange(false);
        navigate(path);
    };

    const actions: Action[] = [
        { label: 'New product rental', icon: Plus, run: () => go('/admin/products?new=1'), keywords: ['rent', 'checkout'] },
        { label: 'New studio booking', icon: CalendarPlus, run: () => go('/admin/studio?new=1'), keywords: ['book', 'room'] },
        { label: 'New invoice', icon: Plus, run: () => go('/admin/invoices?new=1'), keywords: ['bill'] },
        { label: 'Add customer', icon: UserPlus, run: () => go('/admin/customers?new=1'), adminOnly: true },
        { label: 'Add inventory item', icon: PackagePlus, run: () => go('/admin/inventory?new=1'), adminOnly: true },
        {
            label: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`,
            icon: resolvedTheme === 'dark' ? Sun : Moon,
            run: () => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); onOpenChange(false); },
            keywords: ['dark mode', 'appearance'],
        },
        { label: 'Sign out', icon: LogOut, run: () => { onOpenChange(false); void logout().then(() => navigate('/login', { replace: true })); } },
    ];

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-dialog-in"
                >
                    <DialogPrimitive.Title className="sr-only">Command menu</DialogPrimitive.Title>
                    <Command loop>
                        <div className="flex items-center gap-3 border-b px-4">
                            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            <Command.Input autoFocus placeholder="Search pages and actions…" className="h-14 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground" />
                            <Kbd>Esc</Kbd>
                        </div>
                        <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2">
                            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
                            <Command.Group heading="Quick actions" className={groupClass}>
                                {actions.filter(a => !a.adminOnly || canViewAdmin).map(action => (
                                    <Command.Item key={action.label} value={action.label} keywords={action.keywords} onSelect={action.run} className={itemClass}>
                                        <action.icon /> {action.label}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                            {visibleGroups(canViewAdmin).map(group => (
                                <Command.Group key={group.label} heading={group.label} className={groupClass}>
                                    {group.items.map(item => (
                                        <Command.Item key={item.path} value={`Go to ${item.label}`} keywords={item.keywords} onSelect={() => go(item.path)} className={itemClass}>
                                            <item.icon /> {item.label}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            ))}
                        </Command.List>
                    </Command>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

/** The search-style button in the top bar that opens the palette. */
const IS_MAC = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.userAgent);

export const CommandTrigger = ({ onClick }: { onClick: () => void }) => {
    const isMac = IS_MAC;
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border bg-card/60 px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground"
        >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 text-left">Search or jump to…</span>
            <span className="hidden items-center gap-0.5 sm:flex"><Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd><Kbd>K</Kbd></span>
        </button>
    );
};
