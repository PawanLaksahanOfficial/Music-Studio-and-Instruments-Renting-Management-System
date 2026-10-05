import type { ReactNode } from 'react';
import { Dialog as DialogPrimitive, DropdownMenu as Menu, Popover as PopoverPrimitive, Tabs as TabsPrimitive, Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

const floatingPanel = 'z-50 rounded-xl border bg-popover text-popover-foreground shadow-lg shadow-black/5 outline-none data-[state=open]:animate-pop-in';

/* ── Dropdown menu ─────────────────────────────────────────────────────── */
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

export const DropdownMenuContent = ({ className, sideOffset = 6, align = 'end', ...props }: Menu.DropdownMenuContentProps) => (
    <Menu.Portal>
        <Menu.Content sideOffset={sideOffset} align={align} className={cn(floatingPanel, 'min-w-48 p-1', className)} {...props} />
    </Menu.Portal>
);

interface ItemProps extends Menu.DropdownMenuItemProps {
    icon?: ReactNode;
    destructive?: boolean;
}

export const DropdownMenuItem = ({ className, icon, destructive, children, ...props }: ItemProps) => (
    <Menu.Item
        className={cn(
            'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground',
            destructive && 'text-destructive data-highlighted:bg-destructive/10 [&_svg]:text-destructive',
            className,
        )}
        {...props}
    >
        {icon}
        {children}
    </Menu.Item>
);

export const DropdownMenuLabel = ({ className, ...props }: Menu.DropdownMenuLabelProps) => (
    <Menu.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
);

export const DropdownMenuSeparator = ({ className, ...props }: Menu.DropdownMenuSeparatorProps) => (
    <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
);

/* ── Popover ───────────────────────────────────────────────────────────── */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = ({ className, sideOffset = 6, align = 'start', ...props }: PopoverPrimitive.PopoverContentProps) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content sideOffset={sideOffset} align={align} className={cn(floatingPanel, 'p-0', className)} {...props} />
    </PopoverPrimitive.Portal>
);

/* ── Tooltip ───────────────────────────────────────────────────────────── */
export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: TooltipPrimitive.TooltipContentProps['side'] }) => (
    <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content side={side} sideOffset={6} className="z-50 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md data-[state=delayed-open]:animate-fade-in">
                {content}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
);

/* ── Tabs ──────────────────────────────────────────────────────────────── */
export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
    <TabsPrimitive.List
        className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-muted p-1 text-muted-foreground', className)}
        {...props}
    />
);

export const TabsTrigger = ({ className, ...props }: TabsPrimitive.TabsTriggerProps) => (
    <TabsPrimitive.Trigger
        className={cn(
            'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:size-4',
            className,
        )}
        {...props}
    />
);

/* ── Sheet (side drawer) ───────────────────────────────────────────────── */
export const Sheet = DialogPrimitive.Root;

export const SheetContent = ({ className, children, title, ...props }: DialogPrimitive.DialogContentProps & { title: string }) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
            className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(86vw,300px)] flex-col border-r bg-sidebar shadow-2xl outline-none data-[state=open]:animate-slide-in-left', className)}
            aria-describedby={undefined}
            {...props}
        >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
);
