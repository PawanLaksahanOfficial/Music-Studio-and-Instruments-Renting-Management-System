import { RequestHandler } from 'express';
import studioRentalService from '../services/studioRentalService';

// GET /api/studio-rentals/rooms
export const listRooms: RequestHandler = (_req, res) => {
    res.json(studioRentalService.rooms());
};

// GET /api/studio-rentals
export const listStudioRentals: RequestHandler = async (_req, res) => {
    res.json(await studioRentalService.list());
};

// GET /api/studio-rentals/archived
export const listArchivedStudioRentals: RequestHandler = async (_req, res) => {
    res.json(await studioRentalService.listArchived());
};

// GET /api/studio-rentals/:id
export const getStudioRental: RequestHandler = async (req, res) => {
    res.json(await studioRentalService.getById(req.params.id as string));
};

// POST /api/studio-rentals
export const createStudioRental: RequestHandler = async (req, res) => {
    res.status(201).json(await studioRentalService.create(req.body, req.user!));
};

// PATCH /api/studio-rentals/:id
export const updateStudioRental: RequestHandler = async (req, res) => {
    res.json(await studioRentalService.update(req.params.id as string, req.body, req.user!));
};

// PATCH /api/studio-rentals/:id/archive
export const archiveStudioRental: RequestHandler = async (req, res) => {
    res.json(await studioRentalService.archive(req.params.id as string, req.user!));
};

// PATCH /api/studio-rentals/:id/restore
export const restoreStudioRental: RequestHandler = async (req, res) => {
    res.json(await studioRentalService.restore(req.params.id as string, req.user!));
};

// DELETE /api/studio-rentals/:id
export const deleteStudioRental: RequestHandler = async (req, res) => {
    res.json(await studioRentalService.remove(req.params.id as string, req.user!));
};
