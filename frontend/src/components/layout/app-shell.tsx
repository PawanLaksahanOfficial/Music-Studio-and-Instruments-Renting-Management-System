import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Ellipsis, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, Tooltip } from '@/components/ui/menus';
import { PageLoader } from '@/components/data/page';
import { SidebarHeader, SidebarNav } from './sidebar';
import { ThemeToggle, UserMenu } from './user-menu';
import { CommandMenu, CommandTrigger } from './command-menu';
import { ALL_NAV_ITEMS, MOBILE_TABS } from './nav';
import { BrandMark } from './brand';

const COLLAPSE_KEY = 'elvi-sidebar-collapsed';

const readCollapsed = () => {
    try {
        return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
        return false;
    }
};

/**
 * Responsive layout:
 *  - lg and up: persistent sidebar (collapsible to an icon rail)
 *  - below lg: drawer sidebar opened from the top bar
 *  - below md: bottom tab bar for the most used destinations
 */
export const AppShell = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);

    const toggleCollapsed = () => {
        setCollapsed(current => {
            try {
                window.localStorage.setItem(COLLAPSE_KEY, current ? '0' : '1');
            } catch {
                // Not persisted when storage is unavailable.
            }
            return !current;
        });
    };

    const current = ALL_NAV_ITEMS.find(item => location.pathname.startsWith(item.path));

    return (
        <div className="min-h-dvh bg-background">
            <a href="#main" className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
                Skip to content
            </a>

            {/* Desktop sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
                    collapsed ? 'w-[72px]' : 'w-64',
                )}
            >
                <SidebarHeader collapsed={collapsed} />
                <SidebarNav collapsed={collapsed} />
                <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
                    <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
                        <Button variant="ghost" size={collapsed ? 'icon' : 'default'} className={cn(!collapsed && 'w-full justify-start text-muted-foreground')} onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                            {collapsed ? <PanelLeftOpen /> : <><PanelLeftClose /> Collapse</>}
                        </Button>
                    </Tooltip>
                </div>
            </aside>

            {/* Drawer sidebar (tablets and phones) */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent title="Navigation">
                    <SidebarHeader />
                    <SidebarNav onNavigate={() => setDrawerOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className={cn('flex min-h-dvh flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
                <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
                    <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
                        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                            <Menu />
                        </Button>
                        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:hidden" aria-label={current?.label}>
                            <BrandMark className="size-8" />
                            <span className="truncate font-semibold">ELVI</span>
                        </div>
                        <div className="hidden flex-1 md:block">
                            <CommandTrigger onClick={() => setCommandOpen(true)} />
                        </div>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
                            <Search />
                        </Button>
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </header>

                <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>

            <MobileTabBar onMore={() => setDrawerOpen(true)} />
            <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
    );
};

const MobileTabBar = ({ onMore }: { onMore: () => void }) => {
    const tabs = MOBILE_TABS.map(path => ALL_NAV_ITEMS.find(item => item.path === path)!);
    return (
        <nav
            aria-label="Quick navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        >
            <ul className="grid grid-cols-5">
                {tabs.map(tab => (
                    <li key={tab.path}>
                        <NavLink
                            to={tab.path}
                            className={({ isActive }) =>
                                cn('flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-primary/12')}>
                                        <tab.icon className="size-5" aria-hidden />
                                    </span>
                                    {tab.short ?? tab.label}
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
                <li>
                    <button type="button" onClick={onMore} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted-foreground">
                        <span className="grid h-7 w-12 place-items-center"><Ellipsis className="size-5" aria-hidden /></span>
                        More
                    </button>
                </li>
            </ul>
        </nav>
    );
};
