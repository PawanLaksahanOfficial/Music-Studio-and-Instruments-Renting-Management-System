/** Shapes returned by the API. Kept in one place so pages agree on them. */

export interface PageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface Paginated<T> {
    data: T[];
    meta: PageMeta;
}

export interface ListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    paymentStatus?: string;
}

export type Role = 'Admin' | 'Cashier';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer';

export interface AuthUser {
    _id: string;
    name: string;
    username: string;
    email?: string;
    role: Role;
    mustChangePassword: boolean;
}

export interface User extends AuthUser {
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}

export interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nicOrPassport: string;
    isBlacklisted: boolean;
    isArchived: boolean;
    archivedAt?: string;
    createdAt: string;
}

export type InventoryStatus = 'Available' | 'Rented' | 'Maintenance' | 'Damaged' | 'Lost';
export type InventoryCategory = 'Instruments' | 'Audio Gear' | 'Cables' | 'Other';

export interface InventoryItem {
    _id: string;
    itemName: string;
    category: InventoryCategory;
    brand?: string;
    itemModel?: string;
    serialNumber: string;
    qrCodeId: string;
    status: InventoryStatus;
    baseRentalPrice: number;
    purchaseDate?: string;
    lastMaintenance?: string;
    notes?: string;
    isArchived: boolean;
    archivedAt?: string;
}

export interface RentalItem {
    itemId: InventoryItem | string;
    quantity: number;
    dailyRate: number;
    isDamaged: boolean;
    damageCharge: number;
    damageNote?: string;
}

export type RentalStatus = 'Rented' | 'Returned' | 'Overdue';

export interface Rental {
    _id: string;
    rentalId: string;
    customer: Customer;
    items: RentalItem[];
    rentalDate: string;
    dueDate: string;
    returnDate?: string;
    status: RentalStatus;
    baseAmount: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    notes?: string;
    isArchived: boolean;
    archivedAt?: string;
    createdAt: string;
}

export interface RentalQuoteLine {
    itemId: string;
    itemName: string;
    quantity: number;
    dailyRate: number;
    days: number;
    lineTotal: number;
}

export interface RentalQuote {
    days: number;
    lines: RentalQuoteLine[];
    baseAmount: number;
}

export interface Room {
    _id: string;
    name: string;
    hourlyRate: number;
    capacity?: number;
    description?: string;
    isActive: boolean;
}

export type StudioStatus = 'Confirmed' | 'Cancelled' | 'Completed';

export interface StudioRental {
    _id: string;
    bookingId: string;
    customer: Customer;
    room: Room | string;
    roomName: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    hourlyRate: number;
    totalAmount: number;
    status: StudioStatus;
    paymentStatus: 'Paid' | 'Pending';
    notes?: string;
    isArchived: boolean;
    archivedAt?: string;
}

export interface RoomAvailability {
    room: { _id: string; name: string; hourlyRate: number };
    bookings: Array<{
        _id: string;
        bookingId: string;
        startTime: string;
        endTime: string;
        status: StudioStatus;
        customer?: { firstName: string; lastName: string };
    }>;
}

export type InvoiceLineSource = 'ProductRental' | 'StudioRental' | 'Manual';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sourceType: InvoiceLineSource;
    sourceId?: string;
}

export interface Invoice {
    _id: string;
    invoiceId: string;
    customer: Customer;
    productRentals: Array<{ _id: string; rentalId: string }>;
    studioRentals: Array<{ _id: string; bookingId: string; roomName?: string }>;
    items: InvoiceItem[];
    subtotal: number;
    taxRate: number;
    tax: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'Paid' | 'Pending';
    paidAt?: string;
    createdBy?: { _id: string; name: string };
    notes?: string;
    createdAt: string;
}

export interface BillableForCustomer {
    productRentals: Array<{ _id: string; rentalId: string; totalAmount: number; status: string; dueDate: string }>;
    studioRentals: Array<{
        _id: string;
        bookingId: string;
        roomName: string;
        totalAmount: number;
        status: string;
        startTime: string;
    }>;
}

export interface StatsSummary {
    totalRevenue: number;
    activeProductRentals: number;
    overdueRentals: number;
    returnedRentals: number;
    activeStudioRentals: number;
    totalCustomers: number;
    totalInventoryItems: number;
    availableItems: number;
    rentedItems: number;
    damagedItems: number;
    maintenanceItems: number;
    paidInvoices: number;
    pendingInvoices: number;
    pendingPayments: number;
}

export interface MonthlyStat {
    month: string;
    productRentalRevenue: number;
    studioRentalRevenue: number;
    otherRevenue: number;
    totalBookings: number;
}

export interface DashboardStats {
    mostRentedInstruments: Array<{
        itemId: string;
        itemName: string;
        brand?: string;
        category?: string;
        serialNumber?: string;
        rentalCount: number;
        totalRevenue: number;
    }>;
    lateReturns: {
        records: Array<{
            rentalId: string;
            customerName: string;
            lateDays: number;
            lateFee: number;
            totalAmount: number;
            rentalDate: string;
            dueDate: string;
            returnDate: string;
        }>;
        totalLateReturns: number;
        totalLateFeeCollected: number;
        avgLateDays: number;
        maxLateDays: number;
    };
    topCustomers: Array<{
        customerId: string;
        customerName: string;
        phone?: string;
        totalRentals: number;
        totalSpent: number;
        totalLateFees: number;
        totalDamages: number;
    }>;
    damageTrend: Array<{ month: string; charges: number; count: number }>;
    rentalGrowth: Array<{ month: string; newRentals: number; revenue: number }>;
}

export interface CustomerProfile {
    customer: Customer;
    stats: {
        totalRentals: number;
        totalSpending: number;
        lastRentalDate: string | null;
        outstandingFines: number;
        lateReturns: number;
        openRentals: number;
        studioBookings: number;
        onTimeRate: number | null;
    };
    rentalHistory: Rental[];
}
