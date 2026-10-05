import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage, getRequestId } from '@/lib/api';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Card, Skeleton } from '@/components/ui/card';

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    /** Rendered above the title, e.g. a back link. */
    eyebrow?: ReactNode;
}

export const PageHeader = ({ title, description, actions, eyebrow }: PageHeaderProps) => {
    useDocumentTitle(title);
    return (
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {eyebrow && <div className="mb-2">{eyebrow}</div>}
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
        </header>
    );
};

interface StatCardProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon: LucideIcon;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet';
    loading?: boolean;
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export const StatCard = ({ label, value, hint, icon: Icon, tone = 'primary', loading }: StatCardProps) => (
    <Card className="relative overflow-hidden p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
                {loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>}
                {hint && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hint}</p>}
            </div>
            <span className={cn('hidden size-10 shrink-0 place-items-center rounded-xl sm:grid', toneClasses[tone])}>
                <Icon className="size-5" aria-hidden />
            </span>
        </div>
    </Card>
);

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export const ErrorState = ({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) => {
    const requestId = getRequestId(error);
    return (
        <div role="alert" className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
            <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-6" aria-hidden />
            </span>
            <h3 className="text-base font-semibold">Couldn&apos;t load this data</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{getErrorMessage(error)}</p>
            {requestId && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {requestId}</p>}
            {onRetry && (
                <Button variant="outline" className="mt-5" onClick={onRetry}>
                    <RefreshCw /> Try again
                </Button>
            )}
        </div>
    );
};

export const PageLoader = () => (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
        <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
    </div>
);

/** Renders children into a body-level node that is the only thing printed (see index.css). */
export const PrintPortal = ({ children }: { children: ReactNode }) =>
    createPortal(<div data-print-portal>{children}</div>, document.body);

/** Small label/value pair used in detail panels. */
export const Detail = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
    <div className={cn('min-w-0', className)}>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium">{children}</dd>
    </div>
);
