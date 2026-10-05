import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Tooltip } from '@/components/ui/menus';
import { Brand } from './brand';
import { visibleGroups, type NavItem } from './nav';

const NavEntry = ({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) => {
    const link = (
        <NavLink
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-[oklch(0.85_0.1_285)]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
                    <item.icon className="size-[1.125rem] shrink-0" aria-hidden />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                </>
            )}
        </NavLink>
    );
    return collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link;
};

interface SidebarNavProps {
    collapsed?: boolean;
    onNavigate?: () => void;
}

/** Grouped navigation shared by the desktop sidebar and the mobile drawer. */
export const SidebarNav = ({ collapsed = false, onNavigate }: SidebarNavProps) => {
    const { isAdmin } = useAuth();
    return (
        <nav aria-label="Main" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
            {visibleGroups(isAdmin).map(group => (
                <div key={group.label}>
                    {collapsed ? (
                        <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" aria-hidden />
                    ) : (
                        <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.label}</p>
                    )}
                    <ul className="flex flex-col gap-0.5">
                        {group.items.map(item => (
                            <li key={item.path}><NavEntry item={item} collapsed={collapsed} onNavigate={onNavigate} /></li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};

export const SidebarHeader = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <Brand collapsed={collapsed} />
    </div>
);
