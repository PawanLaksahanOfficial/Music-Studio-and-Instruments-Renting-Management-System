import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Progress indicator for multi-step flows (QR checkout / return). */
export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => (
    <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
                <li key={step} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={active ? 'step' : undefined}>
                    <span
                        className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors',
                            done && 'border-primary bg-primary text-primary-foreground',
                            active && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10',
                            !done && !active && 'bg-card text-muted-foreground',
                        )}
                    >
                        {done ? <Check className="size-4" aria-hidden /> : index + 1}
                    </span>
                    <span className={cn('hidden text-sm font-medium sm:inline', active ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
                    {index < steps.length - 1 && <span className={cn('h-px flex-1 transition-colors', done ? 'bg-primary' : 'bg-border')} aria-hidden />}
                </li>
            );
        })}
    </ol>
);
