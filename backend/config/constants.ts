/** "Demo" is a read-only showcase role: it can view every page, but the server rejects any change it makes. */
export const ROLES = ['Admin', 'Cashier', 'Demo'] as const;
export type Role = (typeof ROLES)[number];

export const STUDIO_ROOMS = ['Studio A', 'Studio B', 'Studio C', 'Recording Booth'] as const;

export const INVENTORY_CATEGORIES = ['Instruments', 'Audio Gear', 'Cables', 'Other'] as const;
export const INVENTORY_STATUSES = ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'] as const;

export const RENTAL_STATUSES = ['Rented', 'Returned', 'Overdue'] as const;
export const RENTAL_PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'] as const;

export const STUDIO_STATUSES = ['Confirmed', 'Cancelled', 'Completed'] as const;
export const SIMPLE_PAYMENT_STATUSES = ['Paid', 'Pending'] as const;

export const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer'] as const;
export const INVOICE_LINE_KINDS = ['product', 'studio', 'other'] as const;

/** Rentals that still hold inventory out of the shop. */
export const ACTIVE_RENTAL_STATUSES = ['Rented', 'Overdue'] as const;

export const MAX_STUDIO_BOOKING_HOURS = 24;
