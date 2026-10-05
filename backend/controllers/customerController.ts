import { RequestHandler } from 'express';
import customerService from '../services/customerService';

// GET /api/customers
export const listCustomers: RequestHandler = async (_req, res) => {
    res.json(await customerService.list());
};

// GET /api/customers/archived
export const listArchivedCustomers: RequestHandler = async (_req, res) => {
    res.json(await customerService.listArchived());
};

// GET /api/customers/:id
export const getCustomer: RequestHandler = async (req, res) => {
    res.json(await customerService.getById(req.params.id as string));
};

// GET /api/customers/:id/profile
export const getCustomerProfile: RequestHandler = async (req, res) => {
    res.json(await customerService.getProfile(req.params.id as string));
};

// POST /api/customers
export const createCustomer: RequestHandler = async (req, res) => {
    res.status(201).json(await customerService.create(req.body, req.user!));
};

// PATCH /api/customers/:id
export const updateCustomer: RequestHandler = async (req, res) => {
    res.json(await customerService.update(req.params.id as string, req.body, req.user!));
};

// PATCH /api/customers/:id/blacklist
export const toggleBlacklist: RequestHandler = async (req, res) => {
    res.json(await customerService.toggleBlacklist(req.params.id as string, req.user!));
};

// PATCH /api/customers/:id/archive
export const archiveCustomer: RequestHandler = async (req, res) => {
    res.json(await customerService.archive(req.params.id as string, req.user!));
};

// PATCH /api/customers/:id/restore
export const restoreCustomer: RequestHandler = async (req, res) => {
    res.json(await customerService.restore(req.params.id as string, req.user!));
};

// DELETE /api/customers/:id
export const deleteCustomer: RequestHandler = async (req, res) => {
    res.json(await customerService.remove(req.params.id as string, req.user!));
};
