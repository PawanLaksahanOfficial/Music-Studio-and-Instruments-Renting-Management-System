import { Response } from 'express';
import invoiceService from '../services/invoiceService';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest, requireUser } from '../middleware/auth';

interface ListQuery {
    page: number;
    limit: number;
    search?: string;
    paymentStatus?: string;
}

// GET /api/invoices
export const getAllInvoices = asyncHandler(async (req, res: Response) => {
    res.json(await invoiceService.getAllInvoices(req.query as unknown as ListQuery));
});

// GET /api/invoices/billable/:customerId
export const getBillableForCustomer = asyncHandler(async (req, res: Response) => {
    res.json(await invoiceService.getBillableForCustomer(req.params.customerId));
});

// GET /api/invoices/:id
export const getInvoiceById = asyncHandler(async (req, res: Response) => {
    res.json(await invoiceService.getInvoiceById(req.params.id));
});

// POST /api/invoices
export const createInvoice = asyncHandler<AuthRequest>(async (req, res) => {
    res.status(201).json(await invoiceService.createInvoice(req.body, String(requireUser(req)._id)));
});

// PATCH /api/invoices/:id/payment
export const updatePaymentStatus = asyncHandler(async (req, res: Response) => {
    res.json(await invoiceService.updatePaymentStatus(req.params.id, req.body.paymentStatus));
});
