import { Response } from 'express';
import rentalService from '../services/rentalService';
import { asyncHandler } from '../utils/asyncHandler';

// GET /api/rentals
export const getAllRentals = asyncHandler(async (req, res: Response) => {
    const { page, limit, search, status } = req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        status?: string;
    };
    res.json(await rentalService.getAllRentals({ page, limit, search, status }));
});

// GET /api/rentals/archived
export const getArchivedRentals = asyncHandler(async (req, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    res.json(await rentalService.getArchivedRentals({ page, limit }));
});

// GET /api/rentals/:id
export const getRentalById = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.getRentalById(req.params.id));
});

// POST /api/rentals
export const createNewRental = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await rentalService.createNewRental(req.body));
});

// POST /api/rentals/quote — priced preview, persists nothing
export const quoteRental = asyncHandler(async (req, res: Response) => {
    const { items, rentalDate, dueDate } = req.body;
    res.json(await rentalService.quoteRental(items, rentalDate ?? new Date(), dueDate));
});

// PATCH /api/rentals/:id/status
export const updateRentalStatus = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.updateRentalStatus(req.params.id, req.body.status));
});

// PATCH /api/rentals/:id/extend
export const extendDueDate = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.extendDueDate(req.params.id, req.body.newDueDate));
});

// PATCH /api/rentals/:id/payment
export const updatePaymentStatus = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.updatePaymentStatus(req.params.id, req.body.paymentStatus));
});

// PATCH /api/rentals/:id/archive
export const archiveRental = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.archiveRental(req.params.id));
});

// PATCH /api/rentals/:id/restore
export const restoreRental = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.restoreRental(req.params.id));
});

// DELETE /api/rentals/:id
export const deleteRental = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.deleteRental(req.params.id));
});

// GET /api/rentals/by-qr/:qrCodeId
export const getRentalByQR = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.getRentalByQR(req.params.qrCodeId));
});

// POST /api/rentals/process-return
export const processReturn = asyncHandler(async (req, res: Response) => {
    res.json(await rentalService.processReturn(req.body));
});
