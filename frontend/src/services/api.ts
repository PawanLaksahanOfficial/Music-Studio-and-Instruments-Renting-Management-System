import { http } from './httpClient';
import type {
    AuthUser,
    BillableForCustomer,
    Customer,
    CustomerProfile,
    DashboardStats,
    InventoryItem,
    Invoice,
    ListParams,
    MonthlyStat,
    Paginated,
    Rental,
    RentalQuote,
    Room,
    RoomAvailability,
    StatsSummary,
    StudioRental,
    User,
} from '../types/api';

const unwrap = async <T>(p: Promise<{ data: T }>): Promise<T> => (await p).data;

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authAPI = {
    login: (username: string, password: string) =>
        unwrap<{ token: string; user: AuthUser }>(http.post('/auth/login', { username, password })),
    me: () => unwrap<AuthUser>(http.get('/auth/me')),
    changePassword: (currentPassword: string, newPassword: string) =>
        unwrap<{ token: string; user: AuthUser }>(
            http.post('/auth/change-password', { currentPassword, newPassword })
        ),
    setPassword: (userId: string, token: string, newPassword: string) =>
        unwrap<{ message: string }>(http.post('/auth/set-password', { userId, token, newPassword })),
};

// ─── Users ─────────────────────────────────────────────────────────────────

export const usersAPI = {
    getAll: () => unwrap<User[]>(http.get('/users')),
    create: (data: { name: string; username: string; password: string; role: string; email?: string }) =>
        unwrap<User>(http.post('/users', data)),
    update: (id: string, data: Partial<Pick<User, 'name' | 'role' | 'email' | 'isActive'>>) =>
        unwrap<User>(http.patch(`/users/${id}`, data)),
    toggleActive: (id: string) => unwrap<{ isActive: boolean }>(http.patch(`/users/${id}/toggle-active`)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/users/${id}`)),
    sendSetupLink: (userId: string) => unwrap<{ message: string }>(http.post('/users/send-setup-link', { userId })),
};

// ─── Customers ─────────────────────────────────────────────────────────────

export const customersAPI = {
    getAll: (params?: ListParams) => unwrap<Paginated<Customer>>(http.get('/customers', { params })),
    getArchived: (params?: ListParams) => unwrap<Paginated<Customer>>(http.get('/customers/archived', { params })),
    getById: (id: string) => unwrap<Customer>(http.get(`/customers/${id}`)),
    getProfile: (id: string) => unwrap<CustomerProfile>(http.get(`/customers/${id}/profile`)),
    create: (data: Partial<Customer>) => unwrap<Customer>(http.post('/customers', data)),
    update: (id: string, data: Partial<Customer>) => unwrap<Customer>(http.patch(`/customers/${id}`, data)),
    toggleBlacklist: (id: string) => unwrap<{ isBlacklisted: boolean }>(http.patch(`/customers/${id}/blacklist`)),
    archive: (id: string) => unwrap<{ message: string }>(http.patch(`/customers/${id}/archive`)),
    restore: (id: string) => unwrap<{ message: string }>(http.patch(`/customers/${id}/restore`)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/customers/${id}`)),
};

// ─── Inventory ─────────────────────────────────────────────────────────────

export const inventoryAPI = {
    getAll: (params?: ListParams) => unwrap<Paginated<InventoryItem>>(http.get('/inventory', { params })),
    getArchived: (params?: ListParams) => unwrap<Paginated<InventoryItem>>(http.get('/inventory/archived', { params })),
    getDamaged: (params?: ListParams) => unwrap<Paginated<InventoryItem>>(http.get('/inventory/damaged', { params })),
    getByQR: (qrCodeId: string) => unwrap<InventoryItem>(http.get(`/inventory/qr/${encodeURIComponent(qrCodeId)}`)),
    getById: (id: string) => unwrap<InventoryItem>(http.get(`/inventory/${id}`)),
    create: (data: Partial<InventoryItem>) => unwrap<InventoryItem>(http.post('/inventory', data)),
    update: (id: string, data: Partial<InventoryItem>) => unwrap<InventoryItem>(http.patch(`/inventory/${id}`, data)),
    markRepaired: (id: string) => unwrap<InventoryItem>(http.patch(`/inventory/${id}/repaired`)),
    archive: (id: string) => unwrap<{ message: string }>(http.patch(`/inventory/${id}/archive`)),
    restore: (id: string) => unwrap<{ message: string }>(http.patch(`/inventory/${id}/restore`)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/inventory/${id}`)),
};

// ─── Product rentals ───────────────────────────────────────────────────────

export const rentalsAPI = {
    getAll: (params?: ListParams) => unwrap<Paginated<Rental>>(http.get('/rentals', { params })),
    getArchived: (params?: ListParams) => unwrap<Paginated<Rental>>(http.get('/rentals/archived', { params })),
    getById: (id: string) => unwrap<Rental>(http.get(`/rentals/${id}`)),
    getByQR: (qrCodeId: string) => unwrap<Rental>(http.get(`/rentals/by-qr/${encodeURIComponent(qrCodeId)}`)),
    // Server-priced preview; the create call recomputes it regardless.
    quote: (items: Array<{ itemId: string; quantity: number }>, rentalDate: string, dueDate: string) =>
        unwrap<RentalQuote>(http.post('/rentals/quote', { items, rentalDate, dueDate })),
    create: (data: {
        customerId: string;
        items: Array<{ itemId: string; quantity: number }>;
        rentalDate?: string;
        dueDate: string;
        paymentStatus?: string;
        notes?: string;
    }) => unwrap<Rental>(http.post('/rentals', data)),
    updateStatus: (id: string, status: string) => unwrap<Rental>(http.patch(`/rentals/${id}/status`, { status })),
    extend: (id: string, newDueDate: string) => unwrap<Rental>(http.patch(`/rentals/${id}/extend`, { newDueDate })),
    updatePayment: (id: string, paymentStatus: string) =>
        unwrap<Rental>(http.patch(`/rentals/${id}/payment`, { paymentStatus })),
    processReturn: (data: {
        rentalId: string;
        returnDate: string;
        damages?: Array<{ itemId: string; charge: number; note?: string }>;
        lateFeeOverride?: number;
        paymentStatus: string;
        notes?: string;
    }) => unwrap<Rental>(http.post('/rentals/process-return', data)),
    archive: (id: string) => unwrap<{ message: string }>(http.patch(`/rentals/${id}/archive`)),
    restore: (id: string) => unwrap<{ message: string }>(http.patch(`/rentals/${id}/restore`)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/rentals/${id}`)),
};

// ─── Studio rentals ────────────────────────────────────────────────────────

export const studioRentalsAPI = {
    getAll: (params?: ListParams) => unwrap<Paginated<StudioRental>>(http.get('/studio-rentals', { params })),
    getArchived: (params?: ListParams) => unwrap<Paginated<StudioRental>>(http.get('/studio-rentals/archived', { params })),
    getById: (id: string) => unwrap<StudioRental>(http.get(`/studio-rentals/${id}`)),
    getAvailability: (roomId: string, from: string, to: string) =>
        unwrap<RoomAvailability>(http.get('/studio-rentals/availability', { params: { roomId, from, to } })),
    create: (data: {
        customerId: string;
        roomId: string;
        startTime: string;
        endTime: string;
        paymentStatus?: string;
        notes?: string;
    }) => unwrap<StudioRental>(http.post('/studio-rentals', data)),
    update: (id: string, data: Record<string, unknown>) =>
        unwrap<StudioRental>(http.patch(`/studio-rentals/${id}`, data)),
    updateStatus: (id: string, status: string) =>
        unwrap<StudioRental>(http.patch(`/studio-rentals/${id}/status`, { status })),
    archive: (id: string) => unwrap<{ message: string }>(http.patch(`/studio-rentals/${id}/archive`)),
    restore: (id: string) => unwrap<{ message: string }>(http.patch(`/studio-rentals/${id}/restore`)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/studio-rentals/${id}`)),
};

// ─── Rooms ─────────────────────────────────────────────────────────────────

export const roomsAPI = {
    getAll: (includeInactive = false) => unwrap<Room[]>(http.get('/rooms', { params: { includeInactive } })),
    create: (data: Partial<Room>) => unwrap<Room>(http.post('/rooms', data)),
    update: (id: string, data: Partial<Room>) => unwrap<Room>(http.patch(`/rooms/${id}`, data)),
    remove: (id: string) => unwrap<{ message: string }>(http.delete(`/rooms/${id}`)),
};

// ─── Invoices ──────────────────────────────────────────────────────────────

export const invoicesAPI = {
    getAll: (params?: ListParams) => unwrap<Paginated<Invoice>>(http.get('/invoices', { params })),
    getById: (id: string) => unwrap<Invoice>(http.get(`/invoices/${id}`)),
    getBillable: (customerId: string) => unwrap<BillableForCustomer>(http.get(`/invoices/billable/${customerId}`)),
    create: (data: {
        customerId: string;
        productRentalIds?: string[];
        studioRentalIds?: string[];
        manualItems?: Array<{ description: string; quantity: number; unitPrice: number }>;
        taxRate?: number;
        paymentMethod: string;
        paymentStatus?: string;
        notes?: string;
    }) => unwrap<Invoice>(http.post('/invoices', data)),
    updatePayment: (id: string, paymentStatus: string) =>
        unwrap<Invoice>(http.patch(`/invoices/${id}/payment`, { paymentStatus })),
};

// ─── Stats ─────────────────────────────────────────────────────────────────

interface DateRange {
    start?: string;
    end?: string;
}

export const statsAPI = {
    getSummary: (params?: DateRange) => unwrap<StatsSummary>(http.get('/stats/summary', { params })),
    getMonthly: (params?: DateRange) => unwrap<MonthlyStat[]>(http.get('/stats/monthly', { params })),
    getDashboard: (params?: DateRange) => unwrap<DashboardStats>(http.get('/stats/dashboard', { params })),
};

// ─── Cron ──────────────────────────────────────────────────────────────────

export const cronAPI = {
    triggerReminders: () =>
        unwrap<{ message: string; scanned: number; sent: number; skipped: number; failed: number }>(
            http.post('/cron/trigger-reminders')
        ),
};
