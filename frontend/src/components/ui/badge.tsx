import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
    {
        variants: {
            tone: {
                neutral: 'bg-muted text-muted-foreground ring-border',
                primary: 'bg-primary/10 text-primary ring-primary/20 dark:text-[oklch(0.8_0.12_285)]',
                success: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
                warning: 'bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-300',
                danger: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300',
                info: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
                violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
            },
        },
        defaultVariants: { tone: 'neutral' },
    },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
    /** Shows a leading status dot (status is also conveyed by text, never colour alone). */
    dot?: boolean;
}

export const Badge = ({ className, tone, dot, children, ...props }: BadgeProps) => (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
        {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
        {children}
    </span>
);
