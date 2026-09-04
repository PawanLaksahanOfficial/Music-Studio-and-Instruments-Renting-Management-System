import toast from 'react-hot-toast';
import { inventoryAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { EmptyState, ErrorState, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { InventoryItem } from '../types/api';

const ArchivedInventory = () => {
    const query = usePagedQuery<InventoryItem>(params => inventoryAPI.getArchived(params));

    const restore = async (item: InventoryItem) => {
        try {
            await inventoryAPI.restore(item._id);
            toast.success(`${item.itemName} restored`);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    return (
        <>
            <PageHeader title="Archived inventory" subtitle={query.meta ? `${query.meta.total} archived` : 'Loading…'} />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="archived-inventory-search">
                    Search archived items
                </label>
                <input
                    id="archived-inventory-search"
                    className="input"
                    type="search"
                    placeholder="Search name, serial or brand…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
            </div>

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={6} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState icon="📦" title="No archived items" />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col">Serial</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Daily rate
                                </th>
                                <th scope="col">Archived</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(item => (
                                <tr key={item._id}>
                                    <td data-label="Item">
                                        <strong>{item.itemName}</strong>
                                    </td>
                                    <td data-label="Serial" className="table__mono">
                                        {item.serialNumber}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td data-label="Daily rate" className="table__num">
                                        {currency(item.baseRentalPrice)}
                                    </td>
                                    <td data-label="Archived">{formatDate(item.archivedAt)}</td>
                                    <td data-label="Actions">
                                        <button type="button" className="btn btn--sm" onClick={() => void restore(item)}>
                                            Restore
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {query.meta && <Pagination meta={query.meta} onPageChange={query.setPage} />}
                </div>
            )}
        </>
    );
};

export default ArchivedInventory;
