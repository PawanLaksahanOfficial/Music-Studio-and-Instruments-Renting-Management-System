import { Response } from 'express';
import roomService from '../services/roomService';
import { asyncHandler } from '../utils/asyncHandler';

// GET /api/rooms
export const getAllRooms = asyncHandler(async (req, res: Response) => {
    res.json(await roomService.getAllRooms(req.query.includeInactive === 'true'));
});

// GET /api/rooms/:id
export const getRoomById = asyncHandler(async (req, res: Response) => {
    res.json(await roomService.getRoomById(req.params.id));
});

// POST /api/rooms
export const createRoom = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await roomService.createRoom(req.body));
});

// PATCH /api/rooms/:id
export const updateRoom = asyncHandler(async (req, res: Response) => {
    res.json(await roomService.updateRoom(req.params.id, req.body));
});

// DELETE /api/rooms/:id
export const deleteRoom = asyncHandler(async (req, res: Response) => {
    res.json(await roomService.deleteRoom(req.params.id));
});
