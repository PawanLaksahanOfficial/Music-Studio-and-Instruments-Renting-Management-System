import { RequestHandler } from 'express';
import rentalService from '../services/rentalService';
import { getQuery } from '../middleware/validate';
import { returnQuoteQuery } from '../validators/rental';

// GET /api/rentals
export const listRentals: RequestHandler = async (_req, res) => {
    res.json(await rentalService.list());
};

// GET /api/rentals/archived
export const listArchivedRentals: RequestHandler = async (_req, res) => {
    res.json(await rentalService.listArchived());
};

// GET /api/rentals/by-qr/:qrCodeId
export const getActiveRentalByQr: RequestHandler = async (req, res) => {
    res.json(await rentalService.getActiveByQrCode(req.params.qrCodeId as string));
};

// GET /api/rentals/:id
export const getRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.getById(req.params.id as string));
};

// GET /api/rentals/:id/return-quote?returnDate=YYYY-MM-DD
export const getReturnQuote: RequestHandler = async (req, res) => {
    const { returnDate } = getQuery(res, returnQuoteQuery);
    res.json(await rentalService.returnQuote(req.params.id as string, returnDate));
};

// POST /api/rentals
export const createRental: RequestHandler = async (req, res) => {
    res.status(201).json(await rentalService.create(req.body, req.user!));
};

// PATCH /api/rentals/:id
export const updateRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.update(req.params.id as string, req.body, req.user!));
};

// PATCH /api/rentals/:id/extend
export const extendRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.extend(req.params.id as string, req.body.newDueDate, req.user!));
};

// POST /api/rentals/:id/return
export const returnRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.processReturn(req.params.id as string, req.body, req.user!));
};

// PATCH /api/rentals/:id/archive
export const archiveRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.archive(req.params.id as string, req.user!));
};

// PATCH /api/rentals/:id/restore
export const restoreRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.restore(req.params.id as string, req.user!));
};

// DELETE /api/rentals/:id
export const deleteRental: RequestHandler = async (req, res) => {
    res.json(await rentalService.remove(req.params.id as string, req.user!));
};
