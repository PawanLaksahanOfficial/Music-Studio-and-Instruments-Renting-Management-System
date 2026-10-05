import { useMemo, useState, type ReactNode } from 'react';
import {
    flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
    type ColumnDef, type RowData, type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, SearchX, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Card, Skeleton } from '@/components/ui/card';
import { Input, NativeSelect } from '@/components/ui/input';
import { EmptyState, ErrorState } from './page';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        align?: 'left' | 'right' | 'center';
        className?: string;
    }
}

interface DataTableProps<T> {
    data: T[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<T, any>[];
    getRowId: (row: T) => string;
    isLoading?: boolean;
    error?: unknown;
    onRetry?: () => void;
    /** Text the search box matches against for a row. Omit to hide the search box. */
    searchText?: (row: T) => string;
    searchPlaceholder?: string;
    /** Extra filters shown next to the search box. */
    toolbar?: ReactNode;
    /** Card rendering used on phones instead of the table. */
    renderCard: (row: T) => ReactNode;
    empty: { icon: LucideIcon; title: string; description?: ReactNode; action?: ReactNode };
    initialSorting?: SortingState;
    rowClassName?: (row: T) => string | undefined;
    onRowClick?: (row: T) => void;
    pageSize?: number;
}

const PAGE_SIZES = [10, 20, 50];

/**
 * Searchable, sortable, paginated table. Phones get stacked cards from `renderCard`, so wide
 * tables never force horizontal scrolling of the page.
 */
export function DataTable<T>({
    data, columns, getRowId, isLoading, error, onRetry, searchText, searchPlaceholder = 'Search…', toolbar,
    renderCard, empty, initialSorting = [], rowClassName, onRowClick, pageSize = 10,
}: DataTableProps<T>) {
    const isDesktop = useIsDesktop();
    const [query, setQuery] = useState('');
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

    const rows = useMemo(() => {
        const all = data ?? [];
        const q = query.trim().toLowerCase();
        if (!q || !searchText) return all;
        return all.filter(row => searchText(row).toLowerCase().includes(q));
    }, [data, query, searchText]);

    // TanStack Table returns non-memoizable functions by design; this component doesn't use React Compiler.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: rows,
        columns,
        getRowId,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: false,
    });

    const updateQuery = (value: string) => {
        setQuery(value);
        setPagination(p => ({ ...p, pageIndex: 0 }));
    };

    const pageRows = table.getRowModel().rows;
    const total = rows.length;
    const { pageIndex } = table.getState().pagination;
    const from = total === 0 ? 0 : pageIndex * pagination.pageSize + 1;
    const to = Math.min(total, (pageIndex + 1) * pagination.pageSize);

    let body: ReactNode;
    if (error) {
        body = <ErrorState error={error} onRetry={onRetry} />;
    } else if (isLoading) {
        body = isDesktop ? (
            <div className="space-y-3 p-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
            <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
        );
    } else if ((data ?? []).length === 0) {
        body = <EmptyState {...empty} />;
    } else if (total === 0) {
        body = (
            <EmptyState
                icon={SearchX}
                title="No matches"
                description="Try a different search or clear the filters."
                action={query ? <Button variant="outline" onClick={() => updateQuery('')}>Clear search</Button> : undefined}
            />
        );
    } else if (!isDesktop) {
        body = (
            <ul className="space-y-3">
                {pageRows.map(row => <li key={row.id}>{renderCard(row.original)}</li>)}
            </ul>
        );
    } else {
        body = (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        {table.getHeaderGroups().map(group => (
                            <tr key={group.id} className="border-b bg-muted/40">
                                {group.headers.map(header => {
                                    const meta = header.column.columnDef.meta;
                                    const sortable = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();
                                    const label = flexRender(header.column.columnDef.header, header.getContext());
                                    return (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                                            className={cn(
                                                'h-11 whitespace-nowrap px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground first:pl-5 last:pr-5',
                                                meta?.align === 'right' ? 'text-right' : meta?.align === 'center' ? 'text-center' : 'text-left',
                                                meta?.className,
                                            )}
                                        >
                                            {sortable ? (
                                                <button
                                                    type="button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className={cn('-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 uppercase tracking-wide hover:bg-accent hover:text-foreground', meta?.align === 'right' && 'flex-row-reverse')}
                                                >
                                                    {label}
                                                    {sorted === 'asc' ? <ArrowUp className="size-3.5" /> : sorted === 'desc' ? <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                                                </button>
                                            ) : label}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {pageRows.map(row => (
                            <tr
                                key={row.id}
                                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                className={cn('border-b transition-colors last:border-0 hover:bg-muted/40', onRowClick && 'cursor-pointer', rowClassName?.(row.original))}
                            >
                                {row.getVisibleCells().map(cell => {
                                    const meta = cell.column.columnDef.meta;
                                    return (
                                        <td
                                            key={cell.id}
                                            className={cn(
                                                'px-4 py-3 align-middle first:pl-5 last:pr-5',
                                                meta?.align === 'right' ? 'text-right' : meta?.align === 'center' ? 'text-center' : 'text-left',
                                                meta?.className,
                                            )}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const showToolbar = Boolean(searchText || toolbar);
    const showPagination = !error && !isLoading && total > PAGE_SIZES[0];

    const content = (
        <>
            {showToolbar && (
                <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', isDesktop ? 'border-b p-3' : 'mb-3')}>
                    {searchText && (
                        <div className="sm:max-w-xs sm:flex-1">
                            <Input
                                type="search"
                                value={query}
                                onChange={e => updateQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                aria-label={searchPlaceholder}
                                leading={<Search />}
                                trailing={query ? (
                                    <button type="button" onClick={() => updateQuery('')} className="rounded-md p-1 text-muted-foreground hover:bg-accent" aria-label="Clear search">
                                        <X className="size-4" />
                                    </button>
                                ) : undefined}
                            />
                        </div>
                    )}
                    {toolbar && <div className="flex flex-wrap gap-2 [&>*]:min-w-36 [&>*]:flex-1 sm:[&>*]:flex-none">{toolbar}</div>}
                </div>
            )}
            {body}
            {showPagination && (
                <div className={cn('flex flex-col-reverse items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row', isDesktop ? 'border-t px-5 py-3' : 'mt-4')}>
                    <p aria-live="polite">Showing <span className="font-medium text-foreground">{from}–{to}</span> of <span className="font-medium text-foreground">{total}</span></p>
                    <div className="flex items-center gap-2">
                        <NativeSelect
                            aria-label="Rows per page"
                            value={pagination.pageSize}
                            onChange={e => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                            className="h-9 w-[5.5rem]"
                        >
                            {PAGE_SIZES.map(size => <option key={size} value={size}>{size} / page</option>)}
                        </NativeSelect>
                        <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
                            <ChevronLeft />
                        </Button>
                        <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );

    return isDesktop ? <Card className="overflow-hidden">{content}</Card> : <div>{content}</div>;
}

/** Card frame for the phone layout of DataTable rows. */
export const MobileCard = ({ title, subtitle, badge, children, actions, onClick, className }: {
    title: ReactNode;
    subtitle?: ReactNode;
    badge?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
    onClick?: () => void;
    className?: string;
}) => (
    <Card className={cn('p-4', onClick && 'cursor-pointer active:bg-muted/40', className)} onClick={onClick}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <div className="truncate font-semibold">{title}</div>
                {subtitle && <div className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
                {badge}
                {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
            </div>
        </div>
        {children && <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">{children}</dl>}
    </Card>
);
