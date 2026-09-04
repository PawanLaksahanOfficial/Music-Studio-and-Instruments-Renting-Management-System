import { Response } from 'express';
import customerService from '../services/customerService';
import { asyncHandler } from '../utils/asyncHandler';

interface ListQuery {
    page: number;
    limit: number;
    search?: string;
}

// GET /api/customers
export const getAllCustomers = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.getAllCustomers(req.query as unknown as ListQuery));
});

// GET /api/customers/archived
export const getArchivedCustomers = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.getArchivedCustomers(req.query as unknown as ListQuery));
});

// GET /api/customers/:id/profile
export const getCustomerProfile = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.getCustomerProfile(req.params.id));
});

// GET /api/customers/:id
export const getCustomerById = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.getCustomerById(req.params.id));
});

// POST /api/customers
export const createCustomer = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await customerService.createCustomer(req.body));
});

// PATCH /api/customers/:id
export const updateCustomer = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.updateCustomer(req.params.id, req.body));
});

// PATCH /api/customers/:id/blacklist
export const toggleBlacklist = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.toggleBlacklist(req.params.id));
});

// PATCH /api/customers/:id/archive
export const archiveCustomer = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.archiveCustomer(req.params.id));
});

// PATCH /api/customers/:id/restore
export const restoreCustomer = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.restoreCustomer(req.params.id));
});

// DELETE /api/customers/:id
export const deleteCustomer = asyncHandler(async (req, res: Response) => {
    res.json(await customerService.deleteCustomer(req.params.id));
});
