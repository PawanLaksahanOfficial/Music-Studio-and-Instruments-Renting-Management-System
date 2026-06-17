import axios from 'axios';

const BASE = 'http://localhost:5000/api';

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (username: string, password: string) =>
        axios.post(`${BASE}/auth/login`, { username, password }),
};

// ── Users ─────────────────────────────────────────────────────────────────
export const usersAPI = {
    getAll: () => axios.get(`${BASE}/users`),
    create: (data: object) => axios.post(`${BASE}/users`, data),
    update: (id: string, data: object) => axios.patch(`${BASE}/users/${id}`, data),
    delete: (id: string) => axios.delete(`${BASE}/users/${id}`),
    toggleActive: (id: string) => axios.patch(`${BASE}/users/${id}/toggle-active`),
    shareCredentials: (data: { userId: string; password?: string }) => axios.post(`${BASE}/users/share-credentials`, data),
};

// ── Customers ─────────────────────────────────────────────────────────────
export const customersAPI = {
    getAll: () => axios.get(`${BASE}/customers`),
    getById: (id: string) => axios.get(`${BASE}/customers/${id}`),
    getProfile: (id: string) => axios.get(`${BASE}/customers/${id}/profile`),
    create: (data: object) => axios.post(`${BASE}/customers`, data),
    update: (id: string, data: object) => axios.patch(`${BASE}/customers/${id}`, data),
    delete: (id: string) => axios.delete(`${BASE}/customers/${id}`),
    toggleBlacklist: (id: string) => axios.patch(`${BASE}/customers/${id}/blacklist`),
    archive: (id: string) => axios.patch(`${BASE}/customers/${id}/archive`),
    restore: (id: string) => axios.patch(`${BASE}/customers/${id}/restore`),
    getArchived: () => axios.get(`${BASE}/customers/archived`),
};

// ── Inventory ─────────────────────────────────────────────────────────────
export const inventoryAPI = {
    getAll: () => axios.get(`${BASE}/inventory`),
    getByQR: (qrCodeId: string) => axios.get(`${BASE}/inventory/qr/${qrCodeId}`),
    getDamaged: () => axios.get(`${BASE}/inventory/damaged`),
    create: (data: object) => axios.post(`${BASE}/inventory`, data),
    update: (id: string, data: object) => axios.patch(`${BASE}/inventory/${id}`, data),
    delete: (id: string) => axios.delete(`${BASE}/inventory/${id}`),
    archive: (id: string) => axios.patch(`${BASE}/inventory/${id}/archive`),
    restore: (id: string) => axios.patch(`${BASE}/inventory/${id}/restore`),
    getArchived: () => axios.get(`${BASE}/inventory/archived`),
};

// ── Product Rentals ───────────────────────────────────────────────────────
export const rentalsAPI = {
    getAll: () => axios.get(`${BASE}/rentals`),
    getById: (id: string) => axios.get(`${BASE}/rentals/${id}`),
    create: (data: object) => axios.post(`${BASE}/rentals`, data),
    updateStatus: (id: string, status: string) =>
        axios.patch(`${BASE}/rentals/${id}/status`, { status }),
    extendDueDate: (id: string, newDueDate: string) =>
        axios.patch(`${BASE}/rentals/${id}/extend`, { newDueDate }),
    updatePayment: (id: string, paymentStatus: string) =>
        axios.patch(`${BASE}/rentals/${id}/payment`, { paymentStatus }),
    delete: (id: string) => axios.delete(`${BASE}/rentals/${id}`),
    archive: (id: string) => axios.patch(`${BASE}/rentals/${id}/archive`),
    restore: (id: string) => axios.patch(`${BASE}/rentals/${id}/restore`),
    getArchived: () => axios.get(`${BASE}/rentals/archived`),
    getByQR: (qrCodeId: string) => axios.get(`${BASE}/rentals/by-qr/${qrCodeId}`),
    processReturn: (data: object) => axios.post(`${BASE}/rentals/process-return`, data),
};

// ── Studio Rentals ────────────────────────────────────────────────────────
export const studioRentalsAPI = {
    getAll: () => axios.get(`${BASE}/studio-rentals`),
    getById: (id: string) => axios.get(`${BASE}/studio-rentals/${id}`),
    create: (data: object) => axios.post(`${BASE}/studio-rentals`, data),
    update: (id: string, data: object) => axios.patch(`${BASE}/studio-rentals/${id}`, data),
    updateStatus: (id: string, status: string) =>
        axios.patch(`${BASE}/studio-rentals/${id}/status`, { status }),
    delete: (id: string) => axios.delete(`${BASE}/studio-rentals/${id}`),
    archive: (id: string) => axios.patch(`${BASE}/studio-rentals/${id}/archive`),
    restore: (id: string) => axios.patch(`${BASE}/studio-rentals/${id}/restore`),
    getArchived: () => axios.get(`${BASE}/studio-rentals/archived`),
};

// ── Invoices ──────────────────────────────────────────────────────────────
export const invoicesAPI = {
    getAll: () => axios.get(`${BASE}/invoices`),
    getById: (id: string) => axios.get(`${BASE}/invoices/${id}`),
    create: (data: object) => axios.post(`${BASE}/invoices`, data),
    updatePayment: (id: string, paymentStatus: string) =>
        axios.patch(`${BASE}/invoices/${id}/payment`, { paymentStatus }),
};

// ── Stats ─────────────────────────────────────────────────────────────────
export const statsAPI = {
    getSummary: (params?: { start?: string; end?: string }) => axios.get(`${BASE}/stats/summary`, { params }),
    getMonthly: (params?: { start?: string; end?: string }) => axios.get(`${BASE}/stats/monthly`, { params }),
};

// ── Cron ──────────────────────────────────────────────────────────────────
export const cronAPI = {
    triggerReminders: () => axios.post(`${BASE}/cron/trigger-reminders`),
};