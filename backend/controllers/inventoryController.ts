import { Response } from 'express';
import inventoryService from '../services/inventoryService';
import { asyncHandler } from '../utils/asyncHandler';

interface ListQuery {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category?: string;
}

// GET /api/inventory
export const getAllInventoryRecords = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.getAllInventory(req.query as unknown as ListQuery));
});

// GET /api/inventory/archived
export const getArchivedInventoryRecords = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.getArchivedInventory(req.query as unknown as ListQuery));
});

// GET /api/inventory/damaged
export const getDamagedInventoryRecords = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.getDamagedInventory(req.query as unknown as ListQuery));
});

// GET /api/inventory/qr/:qrCodeId
export const getByQRCode = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.getInventoryByQRCode(req.params.qrCodeId));
});

// GET /api/inventory/:id
export const getInventoryById = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.getInventoryById(req.params.id));
});

// POST /api/inventory
export const createInventoryItem = asyncHandler(async (req, res: Response) => {
    res.status(201).json(await inventoryService.createInventoryItem(req.body));
});

// PATCH /api/inventory/:id
export const updateInventoryItem = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.updateInventoryItem(req.params.id, req.body));
});

// PATCH /api/inventory/:id/repaired
export const markRepaired = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.markRepaired(req.params.id));
});

// PATCH /api/inventory/:id/archive
export const archiveInventoryItem = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.archiveInventoryItem(req.params.id));
});

// PATCH /api/inventory/:id/restore
export const restoreInventoryItem = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.restoreInventoryItem(req.params.id));
});

// DELETE /api/inventory/:id
export const deleteInventoryItem = asyncHandler(async (req, res: Response) => {
    res.json(await inventoryService.deleteInventoryItem(req.params.id));
});
