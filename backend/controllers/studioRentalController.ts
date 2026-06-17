import { Request, Response } from 'express';
import studioRentalService from '../services/studioRentalService';

// GET /api/studio-rentals
export const getAllStudioRentals = async (req: Request, res: Response) => {
    try {
        const rentals = await studioRentalService.getAllStudioRentals();
        res.json(rentals);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/studio-rentals/archived
export const getArchivedStudioRentals = async (req: Request, res: Response) => {
    try {
        const rentals = await studioRentalService.getArchivedStudioRentals();
        res.json(rentals);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/studio-rentals/:id
export const getStudioRentalById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await studioRentalService.getStudioRentalById(id as string);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/studio-rentals
export const createStudioRental = async (req: Request, res: Response) => {
    try {
        const rental = await studioRentalService.createStudioRental(req.body);
        res.status(201).json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id
export const updateStudioRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await studioRentalService.updateStudioRental(id as string, req.body);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id/status
export const updateStudioStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await studioRentalService.updateStudioStatus(id as string, req.body.status);
        res.json(rental);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id/archive
export const archiveStudioRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await studioRentalService.archiveStudioRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/studio-rentals/:id/restore
export const restoreStudioRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await studioRentalService.restoreStudioRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// DELETE /api/studio-rentals/:id
export const deleteStudioRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await studioRentalService.deleteStudioRental(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};