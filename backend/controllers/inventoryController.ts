import { RequestHandler } from 'express';
import inventoryService from '../services/inventoryService';

// GET /api/inventory
export const listInventory: RequestHandler = async (_req, res) => {
    res.json(await inventoryService.list());
};

// GET /api/inventory/archived
export const listArchivedInventory: RequestHandler = async (_req, res) => {
    res.json(await inventoryService.listArchived());
};

// GET /api/inventory/damaged
export const listDamagedInventory: RequestHandler = async (_req, res) => {
    res.json(await inventoryService.listDamaged());
};

// GET /api/inventory/qr/:qrCodeId
export const getByQrCode: RequestHandler = async (req, res) => {
    res.json(await inventoryService.getByQrCode(req.params.qrCodeId as string));
};

// GET /api/inventory/:id
export const getInventoryItem: RequestHandler = async (req, res) => {
    res.json(await inventoryService.getById(req.params.id as string));
};

// POST /api/inventory
export const createInventoryItem: RequestHandler = async (req, res) => {
    res.status(201).json(await inventoryService.create(req.body, req.user!));
};

// PATCH /api/inventory/:id
export const updateInventoryItem: RequestHandler = async (req, res) => {
    res.json(await inventoryService.update(req.params.id as string, req.body, req.user!));
};

// PATCH /api/inventory/:id/archive
export const archiveInventoryItem: RequestHandler = async (req, res) => {
    res.json(await inventoryService.archive(req.params.id as string, req.user!));
};

// PATCH /api/inventory/:id/restore
export const restoreInventoryItem: RequestHandler = async (req, res) => {
    res.json(await inventoryService.restore(req.params.id as string, req.user!));
};

// DELETE /api/inventory/:id
export const deleteInventoryItem: RequestHandler = async (req, res) => {
    res.json(await inventoryService.remove(req.params.id as string, req.user!));
};
