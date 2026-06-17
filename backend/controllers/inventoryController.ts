import { Request, Response } from 'express';
import inventoryService from '../services/inventoryService';

// GET /api/inventory
export const getAllInventoryRecords = async (req: Request, res: Response) => {
    try {
        const items = await inventoryService.getAllInventory();
        res.json(items);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/inventory/archived
export const getArchivedInventoryRecords = async (req: Request, res: Response) => {
    try {
        const items = await inventoryService.getArchivedInventory();
        res.json(items);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/inventory/qr/:qrCodeId
export const getByQRCode = async (req: Request, res: Response) => {
    try {
        const { qrCodeId } = req.params;
        const rawParam = decodeURIComponent(qrCodeId as string);
        const item = await inventoryService.getInventoryByQRCode(rawParam);
        res.json(item);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// GET /api/inventory/:id
export const getInventoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await inventoryService.getInventoryById(id as string);
        res.json(item);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

// POST /api/inventory
export const createInventoryItem = async (req: Request, res: Response) => {
    try {
        const item = await inventoryService.createInventoryItem(req.body);
        res.status(201).json(item);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/inventory/:id
export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await inventoryService.updateInventoryItem(id as string, req.body);
        res.json(item);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/inventory/:id/archive
export const archiveInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await inventoryService.archiveInventoryItem(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// PATCH /api/inventory/:id/restore
export const restoreInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await inventoryService.restoreInventoryItem(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// DELETE /api/inventory/:id
export const deleteInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await inventoryService.deleteInventoryItem(id as string);
        res.json(result);
    } catch (err: any) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

// GET /api/inventory/damaged
export const getDamagedInventoryRecords = async (req: Request, res: Response) => {
    try {
        const items = await inventoryService.getDamagedInventory();
        res.json(items);
    } catch (err: any) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};
