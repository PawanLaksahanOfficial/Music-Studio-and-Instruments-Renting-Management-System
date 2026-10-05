import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Label = ({ className, ...props }: LabelPrimitive.LabelProps) => (
    <LabelPrimitive.Root className={cn('text-sm font-medium text-foreground', className)} {...props} />
);

interface FieldProps {
    label: ReactNode;
    /** The control; its id and aria attributes are wired up automatically. */
    children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    className?: string;
}

/** Label + control + hint/error, with accessible associations. */
export const Field = ({ label, children, error, hint, required, className }: FieldProps) => {
    const generatedId = useId();
    const id = children.props.id ?? generatedId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <Label htmlFor={id}>
                {label}
                {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
            </Label>
            {isValidElement(children)
                ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
                : children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
};

/** Form-level error banner (e.g. a 409 conflict returned by the API). */
export const FormError = ({ message }: { message?: string | null }) =>
    message ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
            {message}
        </div>
    ) : null;
