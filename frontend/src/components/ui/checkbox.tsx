import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = ({ className, ...props }: CheckboxPrimitive.CheckboxProps) => (
    <CheckboxPrimitive.Root
        className={cn(
            'peer grid size-5 shrink-0 place-content-center rounded-md border border-input bg-card shadow-xs transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator>
            <Check className="size-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
);
