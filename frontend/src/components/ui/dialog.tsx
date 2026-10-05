import type { HTMLAttributes, ReactNode } from 'react';
import { AlertDialog as AlertDialogPrimitive, Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const sizes = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
} as const;

const overlayClass = 'fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in';

// Phones: a bottom sheet with a grab handle. sm and up: a centered dialog.
const contentClass = cn(
    'fixed z-50 flex w-full flex-col bg-card text-card-foreground shadow-2xl outline-none',
    'inset-x-0 bottom-0 max-h-[94dvh] rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-sheet-up',
    'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-0 sm:data-[state=open]:animate-dialog-in',
);

const GrabHandle = () => <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 sm:hidden" aria-hidden />;

interface DialogContentProps extends DialogPrimitive.DialogContentProps {
    size?: keyof typeof sizes;
    hideClose?: boolean;
}

export const DialogContent = ({ className, children, size = 'md', hideClose, ...props }: DialogContentProps) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayClass} />
        <DialogPrimitive.Content className={cn(contentClass, sizes[size], className)} {...props}>
            <GrabHandle />
            {children}
            {!hideClose && (
                <DialogPrimitive.Close
                    className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:right-4 sm:top-4"
                    aria-label="Close"
                >
                    <X className="size-4" />
                </DialogPrimitive.Close>
            )}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex shrink-0 flex-col gap-1 px-5 pb-3 pt-4 pr-12 sm:px-6 sm:pt-6', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: DialogPrimitive.DialogTitleProps) => (
    <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: DialogPrimitive.DialogDescriptionProps) => (
    <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
);

/** Scrollable middle section; header and footer stay visible. */
export const DialogBody = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:rounded-b-2xl sm:px-6 [&>button]:w-full sm:[&>button]:w-auto', className)}
        {...props}
    />
);

/* ── Alert dialog (confirmations) ──────────────────────────────────────── */

interface AlertDialogShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer: ReactNode;
}

export const AlertDialogShell = ({ open, onOpenChange, icon, title, description, children, footer }: AlertDialogShellProps) => (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Overlay className={overlayClass} />
            <AlertDialogPrimitive.Content className={cn(contentClass, sizes.sm)}>
                <GrabHandle />
                <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-5 text-center sm:pt-7">
                    {icon}
                    <AlertDialogPrimitive.Title className="text-lg font-semibold tracking-tight">{title}</AlertDialogPrimitive.Title>
                    {description && (
                        <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">{description}</AlertDialogPrimitive.Description>
                    )}
                    {children}
                </div>
                <DialogFooter className="sm:justify-center">{footer}</DialogFooter>
            </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
);

export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
