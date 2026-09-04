import toast from 'react-hot-toast';
import { customersAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { EmptyState, ErrorState, PageHeader, Pagination, TableSkeleton } from '../components/ui';
import { formatDate } from '../utils/format';
import type { Customer } from '../types/api';

const ArchivedCustomers = () => {
    const query = usePagedQuery<Customer>(params => customersAPI.getArchived(params));

    const restore = async (customer: Customer) => {
        try {
            await customersAPI.restore(customer._id);
            toast.success(`${customer.firstName} ${customer.lastName} restored`);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    return (
        <>
            <PageHeader
                title="Archived customers"
                subtitle={query.meta ? `${query.meta.total} archived` : 'Loading…'}
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="archived-customer-search">
                    Search archived customers
                </label>
                <input
                    id="archived-customer-search"
                    className="input"
                    type="search"
                    placeholder="Search name, phone or NIC…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
            </div>

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={5} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState icon="👥" title="No archived customers" />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Phone</th>
                                <th scope="col">NIC / Passport</th>
                                <th scope="col">Archived</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(customer => (
                                <tr key={customer._id}>
                                    <td data-label="Name">
                                        <strong>
                                            {customer.firstName} {customer.lastName}
                                        </strong>
                                    </td>
                                    <td data-label="Phone" className="table__mono">
                                        {customer.phone}
                                    </td>
                                    <td data-label="NIC / Passport" className="table__mono">
                                        {customer.nicOrPassport}
                                    </td>
                                    <td data-label="Archived">{formatDate(customer.archivedAt)}</td>
                                    <td data-label="Actions">
                                        <button type="button" className="btn btn--sm" onClick={() => void restore(customer)}>
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

export default ArchivedCustomers;
