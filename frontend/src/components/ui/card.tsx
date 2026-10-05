import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('rounded-xl border bg-card text-card-foreground shadow-xs', className)} {...props} />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col gap-1 p-5 pb-3 sm:p-6 sm:pb-4', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('text-base font-semibold tracking-tight', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
);

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden {...props} />
);

export const Separator = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div role="separator" className={cn('h-px w-full bg-border', className)} {...props} />
);

export const Kbd = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
    <kbd
        className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[0.6875rem] font-medium text-muted-foreground', className)}
        {...props}
    />
);
