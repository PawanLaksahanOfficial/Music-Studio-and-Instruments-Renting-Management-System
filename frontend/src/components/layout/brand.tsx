import { cn } from '@/lib/utils';

/** Waveform logo mark (same artwork as the favicon). */
export const BrandMark = ({ className }: { className?: string }) => (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-indigo-500/30', className)}>
        <svg viewBox="0 0 64 64" className="size-[62%]" aria-hidden>
            <g fill="#fff">
                <rect x="6" y="24" width="7" height="16" rx="3.5" />
                <rect x="18" y="14" width="7" height="36" rx="3.5" />
                <rect x="30" y="6" width="7" height="52" rx="3.5" />
                <rect x="42" y="16" width="7" height="32" rx="3.5" />
                <rect x="54" y="25" width="7" height="14" rx="3.5" />
            </g>
        </svg>
    </span>
);

export const Brand = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex items-center gap-3">
        <BrandMark />
        {!collapsed && (
            <div className="min-w-0 leading-tight">
                <div className="truncate text-[0.9375rem] font-semibold tracking-tight text-foreground">ELVI Music Studio</div>
                <div className="truncate text-xs text-muted-foreground">Management System</div>
            </div>
        )}
    </div>
);
