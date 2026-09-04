/** Formatting helpers shared across pages. Kept separate from components/ui.tsx
 *  so that file can export components only (required for Fast Refresh). */

const currencyFormatter = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const currency = (n: number | undefined | null): string =>
    n === undefined || n === null ? '—' : `Rs. ${currencyFormatter.format(n)}`;

export const formatDate = (value?: string | null): string =>
    value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (value?: string | null): string =>
    value
        ? new Date(value).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

/** `YYYY-MM-DD` in local time, for binding to `<input type="date">`. */
export const toDateInput = (value?: string | Date | null): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** `YYYY-MM-DDTHH:mm` in local time, for `<input type="datetime-local">`. */
export const toDateTimeInput = (value?: string | Date | null): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '';
    return `${toDateInput(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
