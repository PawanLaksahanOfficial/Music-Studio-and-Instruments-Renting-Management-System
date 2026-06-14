import { Request, Response } from 'express';
import invoiceService from '../services/invoiceService';

// GET /api/invoices
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const invoices = await invoiceService.getAllInvoices();
        res.json(invoices);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.getInvoiceById(id as string);
        res.json(invoice);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/invoices
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body, (req as any).user._id);
        res.status(201).json(invoice);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/invoices/:id/payment
export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.updatePaymentStatus(id as string, req.body.paymentStatus);
        res.json(invoice);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};
