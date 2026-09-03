import { Request, Response } from 'express';
import rentalService from '../services/rentalService';

// GET /api/rentals
export const getAllRentals = async (req: Request, res: Response) => {
    try {
        const rentals = await rentalService.getAllRentals();
        res.json(rentals);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/rentals/archived
export const getArchivedRentals = async (req: Request, res: Response) => {
    try {
        const rentals = await rentalService.getArchivedRentals();
        res.json(rentals);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/rentals/:id
export const getRentalById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await rentalService.getRentalById(id as string);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/rentals
export const createNewRental = async (req: Request, res: Response) => {
    try {
        const rental = await rentalService.createNewRental(req.body);
        res.status(201).json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/status
export const updateRentalStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await rentalService.updateRentalStatus(id as string, req.body.status);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/extend
export const extendDueDate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await rentalService.extendDueDate(id as string, req.body.newDueDate);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/payment
export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await rentalService.updatePaymentStatus(id as string, req.body.paymentStatus);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/archive
export const archiveRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await rentalService.archiveRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/rentals/:id/restore
export const restoreRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await rentalService.restoreRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// DELETE /api/rentals/:id
export const deleteRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await rentalService.deleteRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// GET /api/rentals/by-qr/:qrCodeId
export const getRentalByQR = async (req: Request, res: Response) => {
    try {
        const { qrCodeId } = req.params;
        const rental = await rentalService.getRentalByQR(qrCodeId as string);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/rentals/process-return
export const processReturn = async (req: Request, res: Response) => {
    try {
        const result = await rentalService.processReturn(req.body);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};
