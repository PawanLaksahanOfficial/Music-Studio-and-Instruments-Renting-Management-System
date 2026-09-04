import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import { usePagedQuery } from '../hooks/usePagedQuery';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    EmptyState,
    ErrorState,
    Field,
    PageHeader,
    Pagination,
    StatusBadge,
    TableSkeleton,
} from '../components/ui';
import type { Customer } from '../types/api';

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    nicOrPassport: string;
}

const EMPTY: FormState = { firstName: '', lastName: '', email: '', phone: '', address: '', nicOrPassport: '' };

const CustomersPage = () => {
    const query = usePagedQuery<Customer>(params => customersAPI.getAll(params));

    const [editing, setEditing] = useState<Customer | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [toArchive, setToArchive] = useState<Customer | null>(null);
    const [toBlacklist, setToBlacklist] = useState<Customer | null>(null);

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setFieldErrors({});
        setFormOpen(true);
    };

    const openEdit = (customer: Customer) => {
        setEditing(customer);
        setForm({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email ?? '',
            phone: customer.phone,
            address: customer.address ?? '',
            nicOrPassport: customer.nicOrPassport,
        });
        setFieldErrors({});
        setFormOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFieldErrors({});

        const payload = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email || undefined,
            phone: form.phone,
            address: form.address || undefined,
            nicOrPassport: form.nicOrPassport,
        };

        try {
            if (editing) {
                await customersAPI.update(editing._id, payload);
                toast.success('Customer updated');
            } else {
                await customersAPI.create(payload);
                toast.success('Customer added');
            }
            setFormOpen(false);
            query.refresh();
        } catch (err) {
            if (err instanceof ApiError && err.details?.length) {
                setFieldErrors(err.fieldErrors);
            } else {
                toast.error(errorMessage(err));
            }
        } finally {
            setSaving(false);
        }
    };

    const runAction = async (fn: () => Promise<unknown>, message: string, done: () => void) => {
        try {
            await fn();
            toast.success(message);
            query.refresh();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            done();
        }
    };

    return (
        <>
            <PageHeader
                title="Customers"
                subtitle={query.meta ? `${query.meta.total} customers` : 'Loading…'}
                actions={
                    <button type="button" className="btn btn--primary" onClick={openCreate}>
                        + Add customer
                    </button>
                }
            />

            <div className="filter-bar">
                <label className="sr-only" htmlFor="customer-search">
                    Search customers
                </label>
                <input
                    id="customer-search"
                    className="input"
                    type="search"
                    placeholder="Search name, phone, email or NIC…"
                    value={query.search}
                    onChange={e => query.setSearch(e.target.value)}
                />
            </div>

            {query.error && <ErrorState message={query.error} onRetry={query.refresh} />}

            {query.loading && query.items.length === 0 ? (
                <TableSkeleton cols={6} />
            ) : query.items.length === 0 && !query.error ? (
                <div className="table-wrap">
                    <EmptyState
                        icon="👥"
                        title="No customers found"
                        hint={query.search ? 'Try a different search term.' : 'Add your first customer to get started.'}
                    />
                </div>
            ) : (
                <div className="table-wrap">
                    <table className="table table--stack">
                        <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Phone</th>
                                <th scope="col">Email</th>
                                <th scope="col">NIC / Passport</th>
                                <th scope="col">Standing</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {query.items.map(customer => (
                                <tr key={customer._id}>
                                    <td data-label="Name">
                                        <Link to={`/admin/customers/${customer._id}`}>
                                            <strong>
                                                {customer.firstName} {customer.lastName}
                                            </strong>
                                        </Link>
                                    </td>
                                    <td data-label="Phone" className="table__mono">
                                        {customer.phone}
                                    </td>
                                    <td data-label="Email" className="table__truncate">
                                        {customer.email || '—'}
                                    </td>
                                    <td data-label="NIC / Passport" className="table__mono">
                                        {customer.nicOrPassport}
                                    </td>
                                    <td data-label="Standing">
                                        <StatusBadge status={customer.isBlacklisted ? 'Blacklisted' : 'Active'} />
                                    </td>
                                    <td data-label="Actions">
                                        <div className="btn-group">
                                            <Link className="btn btn--sm" to={`/admin/customers/${customer._id}`}>
                                                Profile
                                            </Link>
                                            <button type="button" className="btn btn--sm" onClick={() => openEdit(customer)}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--sm"
                                                onClick={() => setToBlacklist(customer)}
                                            >
                                                {customer.isBlacklisted ? 'Un-blacklist' : 'Blacklist'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--sm"
                                                onClick={() => setToArchive(customer)}
                                            >
                                                Archive
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {query.meta && <Pagination meta={query.meta} onPageChange={query.setPage} />}
                </div>
            )}

            <Modal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                title={editing ? 'Edit customer' : 'Add customer'}
                footer={
                    <>
                        <button type="button" className="btn" onClick={() => setFormOpen(false)} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" form="customer-form" className="btn btn--primary" disabled={saving}>
                            {saving && <span className="spinner" aria-hidden="true" />}
                            {editing ? 'Save changes' : 'Add customer'}
                        </button>
                    </>
                }
            >
                <form id="customer-form" onSubmit={handleSubmit} className="form-grid">
                    <Field label="First name" htmlFor="firstName" required error={fieldErrors.firstName}>
                        <input
                            id="firstName"
                            className="input"
                            value={form.firstName}
                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Last name" htmlFor="lastName" required error={fieldErrors.lastName}>
                        <input
                            id="lastName"
                            className="input"
                            value={form.lastName}
                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                            required
                        />
                    </Field>

                    <Field
                        label="Phone"
                        htmlFor="phone"
                        required
                        error={fieldErrors.phone}
                        hint="Include the country code so SMS reminders reach them."
                    >
                        <input
                            id="phone"
                            className="input"
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Email" htmlFor="email" error={fieldErrors.email}>
                        <input
                            id="email"
                            className="input"
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </Field>

                    <Field label="NIC / Passport" htmlFor="nicOrPassport" required error={fieldErrors.nicOrPassport}>
                        <input
                            id="nicOrPassport"
                            className="input"
                            value={form.nicOrPassport}
                            onChange={e => setForm({ ...form, nicOrPassport: e.target.value })}
                            required
                        />
                    </Field>

                    <Field label="Address" htmlFor="address" full error={fieldErrors.address}>
                        <textarea
                            id="address"
                            className="textarea"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />
                    </Field>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!toBlacklist}
                onClose={() => setToBlacklist(null)}
                onConfirm={() =>
                    runAction(
                        () => customersAPI.toggleBlacklist(toBlacklist!._id),
                        toBlacklist!.isBlacklisted ? 'Customer un-blacklisted' : 'Customer blacklisted',
                        () => setToBlacklist(null)
                    )
                }
                title={toBlacklist?.isBlacklisted ? 'Remove from blacklist' : 'Blacklist customer'}
                message={
                    toBlacklist?.isBlacklisted
                        ? `Allow ${toBlacklist?.firstName} ${toBlacklist?.lastName} to rent again?`
                        : `Blacklisted customers cannot start new rentals or studio bookings. Existing rentals are unaffected.`
                }
                confirmLabel={toBlacklist?.isBlacklisted ? 'Un-blacklist' : 'Blacklist'}
                tone={toBlacklist?.isBlacklisted ? 'primary' : 'danger'}
            />

            <ConfirmDialog
                isOpen={!!toArchive}
                onClose={() => setToArchive(null)}
                onConfirm={() =>
                    runAction(
                        () => customersAPI.archive(toArchive!._id),
                        'Customer archived',
                        () => setToArchive(null)
                    )
                }
                title="Archive customer"
                message={`Archive ${toArchive?.firstName} ${toArchive?.lastName}? Customers with rentals still out cannot be archived until those are returned.`}
                confirmLabel="Archive"
                tone="primary"
            />
        </>
    );
};

export default CustomersPage;
