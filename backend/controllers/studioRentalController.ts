import { Response } from 'express';
import studioRentalService from '../services/studioRentalService';
import { asyncHandler } from '../utils/asyncHandler';

interface ListQuery {
    page: number;
    limit: number;
    search?: string;
    status?: string;
}

// GET /api/studio-rentals
export const getAllStudioRentals = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.getAllStudioRentals(req.query as unknown as ListQuery));
});

// GET /api/studio-rentals/archived
export const getArchivedStudioRentals = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.getArchivedStudioRentals(req.query as unknown as ListQuery));
});

// GET /api/studio-rentals/availability
export const getRoomAvailability = asyncHandler(async (req, res: Response) => {
    const { roomId, from, to } = req.query as unknown as { roomId: string; from: Date; to: Date };
    res.json(await studioRentalService.getRoomAvailability(roomId, from, to));
});

// GET /api/studio-rentals/:id
export const getStudioRentalById = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.getStudioRentalById(req.params.id));
});

// POST /api/studio-rentals
export const createStudioRental = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await studioRentalService.createStudioRental(req.body));
});

// PATCH /api/studio-rentals/:id
export const updateStudioRental = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.updateStudioRental(req.params.id, req.body));
});

// PATCH /api/studio-rentals/:id/status
export const updateStudioStatus = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.updateStudioStatus(req.params.id, req.body.status));
});

// PATCH /api/studio-rentals/:id/archive
export const archiveStudioRental = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.archiveStudioRental(req.params.id));
});

// PATCH /api/studio-rentals/:id/restore
export const restoreStudioRental = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.restoreStudioRental(req.params.id));
});

// DELETE /api/studio-rentals/:id
export const deleteStudioRental = asyncHandler(async (req, res: Response) => {
    res.json(await studioRentalService.deleteStudioRental(req.params.id));
});
