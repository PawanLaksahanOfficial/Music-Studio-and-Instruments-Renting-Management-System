export const INVENTORY_CATEGORIES = ['Instruments', 'Audio Gear', 'Cables', 'Other'] as const;
export const INVENTORY_STATUSES = ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'] as const;
/** Statuses staff can set by hand; "Rented" only comes from the rental workflow. */
export const MANUAL_INVENTORY_STATUSES = ['Available', 'Maintenance', 'Damaged', 'Lost'] as const;

export const RENTAL_STATUSES = ['Rented', 'Overdue', 'Returned'] as const;
export const RENTAL_PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid'] as const;
export const SIMPLE_PAYMENT_STATUSES = ['Pending', 'Paid'] as const;
export const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer'] as const;

export const STUDIO_ROOMS = ['Studio A', 'Studio B', 'Studio C', 'Recording Booth'] as const;
export const STUDIO_STATUSES = ['Confirmed', 'Completed', 'Cancelled'] as const;

export const ROLES = ['Cashier', 'Admin'] as const;
