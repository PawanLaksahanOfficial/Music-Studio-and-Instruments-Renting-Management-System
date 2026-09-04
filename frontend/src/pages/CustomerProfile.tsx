import { useCallback, useEffect, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customersAPI } from '../services/api';
import { errorMessage } from '../services/httpClient';
import { EmptyState, ErrorState, PageHeader, StatusBadge, TableSkeleton } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { CustomerProfile as Profile } from '../types/api';

interface ProfileState {
    profile: Profile | null;
    loading: boolean;
    error: string | null;
}

type ProfileAction = { type: 'start' } | { type: 'success'; profile: Profile } | { type: 'error'; message: string };

const profileReducer = (state: ProfileState, action: ProfileAction): ProfileState => {
    switch (action.type) {
        case 'start':
            return { profile: state.profile, loading: true, error: null };
        case 'success':
            return { profile: action.profile, loading: false, error: null };
        case 'error':
            return { profile: null, loading: false, error: action.message };
    }
};

const CustomerProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const [{ profile, loading, error }, dispatch] = useReducer(profileReducer, {
        profile: null,
        loading: true,
        error: null,
    });

    const load = useCallback(() => {
        if (!id) return;
        dispatch({ type: 'start' });
        customersAPI
            .getProfile(id)
            .then(profile => dispatch({ type: 'success', profile }))
            .catch(err => dispatch({ type: 'error', message: errorMessage(err) }));
    }, [id]);

    useEffect(load, [load]);

    if (loading) {
        return (
            <>
                <PageHeader title="Customer profile" />
                <div className="stat-grid mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 84 }} />
                    ))}
                </div>
                <TableSkeleton cols={6} />
            </>
        );
    }

    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!profile) return null;

    const { customer, stats, rentalHistory } = profile;

    return (
        <>
            <PageHeader
                title={`${customer.firstName} ${customer.lastName}`}
                subtitle={
                    <>
                        {customer.phone}
                        {customer.email ? ` · ${customer.email}` : ''} · NIC {customer.nicOrPassport}
                    </>
                }
                actions={
                    <Link className="btn" to="/admin/customers">
                        ← All customers
                    </Link>
                }
            />

            {customer.isBlacklisted && (
                <div className="alert alert--danger mb-4" role="alert">
                    <span aria-hidden="true">⚠</span>
                    <div>This customer is blacklisted and cannot start new rentals.</div>
                </div>
            )}

            <div className="stat-grid mb-4">
                <div className="stat">
                    <div className="stat__label">Total rentals</div>
                    <div className="stat__value">{stats.totalRentals}</div>
                    <div className="stat__hint">{stats.studioBookings} studio bookings</div>
                </div>
                <div className="stat stat--success">
                    <div className="stat__label">Lifetime spend</div>
                    <div className="stat__value">{currency(stats.totalSpending)}</div>
                    <div className="stat__hint">Rentals and studio combined</div>
                </div>
                <div className={`stat ${stats.outstandingFines > 0 ? 'stat--danger' : 'stat--success'}`}>
                    <div className="stat__label">Outstanding fines</div>
                    <div className="stat__value">{currency(stats.outstandingFines)}</div>
                    <div className="stat__hint">Unpaid late and damage charges</div>
                </div>
                <div className={`stat ${stats.lateReturns > 0 ? 'stat--warning' : 'stat--success'}`}>
                    <div className="stat__label">On-time returns</div>
                    <div className="stat__value">
                        {stats.onTimeRate === null ? '—' : `${stats.onTimeRate}%`}
                    </div>
                    <div className="stat__hint">
                        {stats.lateReturns} late · {stats.openRentals} currently out
                    </div>
                </div>
            </div>

            <h2 className="mb-4">Rental history</h2>

            {rentalHistory.length === 0 ? (
                <div className="table-wrap">
                    <EmptyState icon="📋" title="No rentals yet" hint="This customer has not rented anything." />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Rental</th>
                                <th scope="col">Items</th>
                                <th scope="col">Rented</th>
                                <th scope="col">Due</th>
                                <th scope="col">Returned</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="table__num">
                                    Total
                                </th>
                                <th scope="col">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rentalHistory.map(rental => {
                                const isLate =
                                    rental.returnDate && new Date(rental.returnDate) > new Date(rental.dueDate);
                                return (
                                    <tr key={rental._id}>
                                        <td data-label="Rental" className="table__mono">
                                            {rental.rentalId}
                                        </td>
                                        <td data-label="Items" className="table__truncate">
                                            {rental.items
                                                .map(i => (typeof i.itemId === 'string' ? i.itemId : i.itemId?.itemName))
                                                .filter(Boolean)
                                                .join(', ') || '—'}
                                        </td>
                                        <td data-label="Rented">{formatDate(rental.rentalDate)}</td>
                                        <td data-label="Due">{formatDate(rental.dueDate)}</td>
                                        <td data-label="Returned">
                                            {formatDate(rental.returnDate)}
                                            {isLate && (
                                                <span className="badge badge--danger" style={{ marginLeft: 6 }}>
                                                    Late
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Status">
                                            <StatusBadge status={rental.status} />
                                        </td>
                                        <td data-label="Total" className="table__num">
                                            {currency(rental.totalAmount)}
                                            {(rental.lateFee > 0 || rental.damageCharges > 0) && (
                                                <div className="faint text-sm">
                                                    base {currency(rental.baseAmount)}
                                                    {rental.lateFee > 0 && ` · late ${currency(rental.lateFee)}`}
                                                    {rental.damageCharges > 0 &&
                                                        ` · damage ${currency(rental.damageCharges)}`}
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Payment">
                                            <StatusBadge status={rental.paymentStatus} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default CustomerProfilePage;
