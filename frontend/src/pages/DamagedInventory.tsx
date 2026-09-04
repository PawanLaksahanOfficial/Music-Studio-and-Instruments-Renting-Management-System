import toast from 'react-hot-toast';
import { inventoryAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { EmptyState, ErrorState, PageHeader, Pagination, TableSkeleton } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { InventoryItem } from '../types/api';

const DamagedInventory = () => {
    const query = usePagedQuery<InventoryItem>(params => inventoryAPI.getDamaged(params));

    const markRepaired = async (item: InventoryItem) => {
        try {
            await inventoryAPI.markRepaired(item._id);
            toast.success(`${item.itemName} marked Available`);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    return (
        <>
            <PageHeader
                title="Damaged inventory"
                subtitle={query.meta ? `${query.meta.total} item${query.meta.total === 1 ? '' : 's'} need attention` : 'Loading…'}
            />

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={5} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState icon="✅" title="Nothing damaged right now" hint="All inventory is in good condition." />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col">Serial</th>
                                <th scope="col" className="table__num">
                                    Daily rate
                                </th>
                                <th scope="col">Last updated</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(item => (
                                <tr key={item._id}>
                                    <td data-label="Item">
                                        <strong>{item.itemName}</strong>
                                        {item.notes && <div className="faint text-sm">{item.notes}</div>}
                                    </td>
                                    <td data-label="Serial" className="table__mono">
                                        {item.serialNumber}
                                    </td>
                                    <td data-label="Daily rate" className="table__num">
                                        {currency(item.baseRentalPrice)}
                                    </td>
                                    <td data-label="Last updated">{formatDate(item.lastMaintenance)}</td>
                                    <td data-label="Actions">
                                        <button
                                            type="button"
                                            className="btn btn--sm btn--primary"
                                            onClick={() => void markRepaired(item)}
                                        >
                                            Mark repaired
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

export default DamagedInventory;
