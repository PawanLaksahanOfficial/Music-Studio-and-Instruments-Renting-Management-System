import type {
    INVENTORY_CATEGORIES, INVENTORY_STATUSES, PAYMENT_METHODS, RENTAL_PAYMENT_STATUSES, RENTAL_STATUSES,
    ROLES, SIMPLE_PAYMENT_STATUSES, STUDIO_STATUSES,
} from '@/lib/constants';

export type Role = (typeof ROLES)[number];
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];
export type RentalStatus = (typeof RENTAL_STATUSES)[number];
export type RentalPaymentStatus = (typeof RENTAL_PAYMENT_STATUSES)[number];
export type SimplePaymentStatus = (typeof SIMPLE_PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type StudioStatus = (typeof STUDIO_STATUSES)[number];

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

export type CustomerRef = Pick<Customer, '_id' | 'firstName' | 'lastName' | 'phone'> & Partial<Pick<Customer, 'email' | 'nicOrPassport' | 'isBlacklisted'>>;

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
    createdAt: string;
    updatedAt: string;
}

export type InventoryRef = Pick<InventoryItem, '_id' | 'itemName' | 'serialNumber' | 'baseRentalPrice'>
    & Partial<Pick<InventoryItem, 'brand' | 'itemModel' | 'qrCodeId' | 'category' | 'status'>>;

export interface RentalItem {
    itemId: InventoryRef | null;
    quantity: number;
    dailyRate?: number;
}

export interface Rental {
    _id: string;
    rentalId: string;
    customer: CustomerRef | null;
    items: RentalItem[];
    rentalDate: string;
    dueDate: string;
    returnDate?: string;
    status: RentalStatus;
    baseAmount?: number;
    totalAmount: number;
    paymentStatus: RentalPaymentStatus;
    paymentMethod?: PaymentMethod;
    lateFee: number;
    damageCharges: number;
    damageNotes: string;
    notes?: string;
    isArchived: boolean;
    archivedAt?: string;
    createdAt: string;
}

export interface ReturnQuote {
    rentalId: string;
    baseAmount: number;
    dailyTotal: number;
    lateDays: number;
    lateFee: number;
}

export interface StudioBooking {
    _id: string;
    bookingId: string;
    customer: CustomerRef | null;
    roomName: string;
    startTime: string;
    endTime: string;
    durationHours?: number;
    totalAmount: number;
    status: StudioStatus;
    paymentStatus: SimplePaymentStatus;
    notes?: string;
    isArchived: boolean;
    archivedAt?: string;
    createdAt: string;
}

export interface InvoiceLine {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    kind?: 'product' | 'studio' | 'other';
}

export interface Invoice {
    _id: string;
    invoiceId: string;
    customer: CustomerRef | null;
    productRentals: { _id: string; rentalId: string }[];
    studioRentals: { _id: string; bookingId: string; roomName?: string }[];
    items: InvoiceLine[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: SimplePaymentStatus;
    paidAt?: string;
    createdBy: { _id: string; name: string } | null;
    notes?: string;
    createdAt: string;
}

export interface CustomerProfile {
    customer: Customer;
    stats: {
        totalRentals: number;
        activeRentals: number;
        totalSpending: number;
        lastRentalDate: string | null;
        outstandingFines: number;
    };
    rentalHistory: (Pick<Rental, '_id' | 'rentalId' | 'items' | 'rentalDate' | 'dueDate' | 'returnDate' | 'status' | 'totalAmount' | 'paymentStatus' | 'lateFee' | 'damageCharges' | 'damageNotes' | 'isArchived'>)[];
}

export interface StatsSummary {
    totalRevenue: number;
    paidInvoices: number;
    pendingInvoices: number;
    pendingPayments: number;
    activeProductRentals: number;
    overdueRentals: number;
    activeStudioRentals: number;
    totalCustomers: number;
    inventory: { total: number; available: number; rented: number; maintenance: number; damaged: number; lost: number };
}

export interface MonthlyRevenue {
    month: string;
    productRentalRevenue: number;
    studioRentalRevenue: number;
    otherRevenue: number;
    totalBookings: number;
}

export interface StatsDashboard {
    mostRentedInstruments: { itemId: string; itemName?: string; brand?: string; serialNumber?: string; rentalCount: number; totalRevenue: number }[];
    lateReturns: {
        records: { _id: string; rentalId: string; customerName: string; lateDays: number; lateFee: number; totalAmount: number; rentalDate: string; dueDate: string; returnDate: string }[];
        totalLateReturns: number;
        totalLateFeeCollected: number;
        avgLateDays: number;
    };
    topCustomers: { customerId: string; customerName: string; phone?: string; totalRentals: number; totalSpent: number; totalLateFees: number; totalDamages: number }[];
    damageTrend: { month: string; charges: number; count: number }[];
    rentalGrowth: { month: string; newRentals: number; revenue: number }[];
}
