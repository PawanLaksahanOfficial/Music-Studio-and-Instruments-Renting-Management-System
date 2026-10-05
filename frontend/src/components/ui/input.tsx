import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const controlBase =
    'w-full rounded-lg border border-input bg-card text-sm text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Icon or text rendered inside the left edge (e.g. a search icon or "Rs."). */
    leading?: ReactNode;
    trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, leading, trailing, ...props }, ref) => {
    const input = (
        <input
            ref={ref}
            className={cn(controlBase, 'h-10 px-3', leading && 'pl-9', trailing && 'pr-10', className)}
            {...props}
        />
    );
    if (!leading && !trailing) return input;
    return (
        <div className="relative">
            {leading && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">{leading}</span>}
            {input}
            {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
        </div>
    );
});
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlBase, 'min-h-20 resize-y px-3 py-2.5', className)} {...props} />
));
Textarea.displayName = 'Textarea';

/** Native select: accessible and uses the platform picker on phones. */
export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
    <div className="relative">
        <select ref={ref} className={cn(controlBase, 'h-10 appearance-none pl-3 pr-9', className)} {...props}>
            {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
));
NativeSelect.displayName = 'NativeSelect';
