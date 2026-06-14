import { Request, Response } from 'express';
import customerService from '../services/customerService';

// GET /api/customers
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await customerService.getAllCustomers();
        res.json(customers);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/customers/:id
export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const customer = await customerService.getCustomerById(id as string);
        res.json(customer);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/customers
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await customerService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/customers/:id
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const customer = await customerService.updateCustomer(id as string, req.body);
        res.json(customer);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/customers/:id/blacklist
export const toggleBlacklist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await customerService.toggleBlacklist(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// DELETE /api/customers/:id
export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await customerService.deleteCustomer(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};
