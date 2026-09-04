import type { ReactNode } from 'react';
import type { PageMeta } from '../types/api';

/* ─── Status badge ──────────────────────────────────────────────────────── */

const BADGE_TONE: Record<string, string> = {
    // Rentals
    Rented: 'accent',
    Returned: 'success',
    Overdue: 'danger',
    // Studio
    Confirmed: 'accent',
    Completed: 'success',
    Cancelled: 'neutral',
    // Inventory
    Available: 'success',
    Maintenance: 'warning',
    Damaged: 'danger',
    Lost: 'neutral',
    // Payment
    Paid: 'success',
    Pending: 'warning',
    Partial: 'info',
    // People
    Admin: 'accent',
    Cashier: 'success',
    Active: 'success',
    Inactive: 'neutral',
    Blacklisted: 'danger',
};

export const StatusBadge = ({ status }: { status: string }) => {
    const tone = BADGE_TONE[status] ?? 'neutral';
    return <span className={`badge badge--${tone}`}>{status}</span>;
};

/* ─── Page header ───────────────────────────────────────────────────────── */

export const PageHeader = ({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
}) => (
    <header className="page-header">
        <div>
            <h1>{title}</h1>
            {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="btn-group">{actions}</div>}
    </header>
);

/* ─── Loading / empty / error ───────────────────────────────────────────── */

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
    <div className="table-wrap" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading…</span>
        <table className="table">
            <tbody>
                {Array.from({ length: rows }).map((_, r) => (
                    <tr key={r}>
                        {Array.from({ length: cols }).map((__, c) => (
                            <td key={c}>
                                <div className="skeleton skeleton--text" style={{ width: c === 0 ? '70%' : '50%' }} />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const EmptyState = ({
    icon = '📭',
    title,
    hint,
    action,
}: {
    icon?: string;
    title: string;
    hint?: string;
    action?: ReactNode;
}) => (
    <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">
            {icon}
        </div>
        <p className="empty-state__title">{title}</p>
        {hint && <p className="empty-state__hint">{hint}</p>}
        {action && <div className="btn-group mt-4" style={{ justifyContent: 'center' }}>{action}</div>}
    </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="alert alert--danger" role="alert">
        <span aria-hidden="true">⚠</span>
        <div className="grow">{message}</div>
        {onRetry && (
            <button type="button" className="btn btn--sm" onClick={onRetry}>
                Retry
            </button>
        )}
    </div>
);

/* ─── Pagination ────────────────────────────────────────────────────────── */

export const Pagination = ({ meta, onPageChange }: { meta: PageMeta; onPageChange: (page: number) => void }) => {
    if (meta.total === 0) return null;

    const from = (meta.page - 1) * meta.limit + 1;
    const to = Math.min(meta.page * meta.limit, meta.total);

    return (
        <nav className="pagination" aria-label="Pagination">
            <span>
                Showing <strong className="num">{from}</strong>–<strong className="num">{to}</strong> of{' '}
                <strong className="num">{meta.total}</strong>
            </span>
            <div className="pagination__controls">
                <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onPageChange(meta.page - 1)}
                    disabled={!meta.hasPrev}
                >
                    ← Previous
                </button>
                <span aria-current="page">
                    Page {meta.page} of {meta.totalPages}
                </span>
                <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onPageChange(meta.page + 1)}
                    disabled={!meta.hasNext}
                >
                    Next →
                </button>
            </div>
        </nav>
    );
};

/* ─── Form field ────────────────────────────────────────────────────────── */

export const Field = ({
    label,
    htmlFor,
    error,
    hint,
    required,
    full,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    full?: boolean;
    children: ReactNode;
}) => (
    <div className={`field${full ? ' field--full' : ''}`}>
        <label className="field__label" htmlFor={htmlFor}>
            {label}
            {required && (
                <>
                    {' '}
                    <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                </>
            )}
        </label>
        {children}
        {hint && !error && <span className="field__hint">{hint}</span>}
        {error && (
            <span className="field__error" role="alert">
                {error}
            </span>
        )}
    </div>
);

