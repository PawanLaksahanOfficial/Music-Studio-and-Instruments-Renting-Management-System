import toast from 'react-hot-toast';
import { rentalsAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { EmptyState, ErrorState, PageHeader, Pagination, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { Rental } from '../types/api';

const ArchivedRentals = () => {
    const query = usePagedQuery<Rental>(params => rentalsAPI.getArchived(params));

    const restore = async (rental: Rental) => {
        try {
            await rentalsAPI.restore(rental._id);
            toast.success(`${rental.rentalId} restored`);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    return (
        <>
            <PageHeader title="Archived rentals" subtitle={query.meta ? `${query.meta.total} archived` : 'Loading…'} />

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={6} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState icon="📋" title="No archived rentals" />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Rental</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Total
                                </th>
                                <th scope="col">Archived</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(rental => (
                                <tr key={rental._id}>
                                    <td data-label="Rental" className="table__mono">
                                        {rental.rentalId}
                                    </td>
                                    <td data-label="Customer">
                                        {rental.customer
                                            ? `${rental.customer.firstName} ${rental.customer.lastName}`
                                            : '—'}
                                    </td>
                                    <td data-label="Status">
                                        <StatusBadge status={rental.status} />
                                    </td>
                                    <td data-label="Total" className="table__num">
                                        {currency(rental.totalAmount)}
                                    </td>
                                    <td data-label="Archived">{formatDate(rental.archivedAt)}</td>
                                    <td data-label="Actions">
                                        <button type="button" className="btn btn--sm" onClick={() => void restore(rental)}>
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

export default ArchivedRentals;
