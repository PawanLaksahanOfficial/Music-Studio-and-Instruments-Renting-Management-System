import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
                outline: 'border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
                ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
                soft: 'bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/30',
                destructive: 'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/25 hover:bg-destructive/90',
                link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                default: 'h-10 px-4',
                lg: 'h-11 px-6 text-[0.9375rem]',
                icon: 'size-10',
                'icon-sm': 'size-8',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, disabled, children, type, ...props }, ref) => {
        if (asChild) {
            return <Slot.Root ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Slot.Root>;
        }
        return (
            <button
                ref={ref}
                type={type ?? 'button'}
                className={cn(buttonVariants({ variant, size }), className)}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...props}
            >
                {loading && <Loader2 className="animate-spin" aria-hidden />}
                {children}
            </button>
        );
    },
);
Button.displayName = 'Button';
