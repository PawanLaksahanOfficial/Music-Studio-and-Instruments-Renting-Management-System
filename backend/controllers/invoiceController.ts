import { RequestHandler } from 'express';
import invoiceService from '../services/invoiceService';

// GET /api/invoices
export const listInvoices: RequestHandler = async (_req, res) => {
    res.json(await invoiceService.list());
};

// GET /api/invoices/:id
export const getInvoice: RequestHandler = async (req, res) => {
    res.json(await invoiceService.getById(req.params.id as string));
};

// POST /api/invoices
export const createInvoice: RequestHandler = async (req, res) => {
    res.status(201).json(await invoiceService.create(req.body, req.user!));
};

// PATCH /api/invoices/:id/payment
export const updateInvoicePayment: RequestHandler = async (req, res) => {
    res.json(await invoiceService.updatePayment(req.params.id as string, req.body.paymentStatus, req.user!));
};
