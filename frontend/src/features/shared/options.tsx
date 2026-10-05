import { useMemo } from 'react';
import { useCustomers } from '@/api/customers';
import { useInventory } from '@/api/inventory';
import { formatCurrency } from '@/lib/format';
import { fullName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * Customers for searchable pickers. Blacklisted customers are shown but can't be picked for new
 * rentals or bookings; invoices may still be raised for them (`allowBlacklisted`).
 */
export const useCustomerOptions = ({ allowBlacklisted = false }: { allowBlacklisted?: boolean } = {}) => {
    const query = useCustomers();
    const options = useMemo<ComboboxOption[]>(
        () =>
            (query.data ?? []).map(c => ({
                value: c._id,
                label: fullName(c),
                description: c.phone,
                keywords: [c.phone, c.nicOrPassport, c.email ?? ''],
                disabled: c.isBlacklisted && !allowBlacklisted,
                badge: c.isBlacklisted ? <Badge tone="danger">Blacklisted</Badge> : undefined,
            })),
        [query.data, allowBlacklisted],
    );
    return { ...query, options };
};

/** Items that can be rented right now. */
export const useAvailableItemOptions = () => {
    const query = useInventory();
    const available = useMemo(() => (query.data ?? []).filter(i => i.status === 'Available'), [query.data]);
    const options = useMemo<ComboboxOption[]>(
        () =>
            available.map(i => ({
                value: i._id,
                label: i.itemName,
                description: `${i.serialNumber} · ${formatCurrency(i.baseRentalPrice)}/day`,
                keywords: [i.serialNumber, i.brand ?? '', i.itemModel ?? '', i.category, i.qrCodeId],
            })),
        [available],
    );
    return { ...query, available, options };
};
