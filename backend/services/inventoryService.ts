import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import Inventory from '../models/Inventory';
import ProductRental from '../models/ProductRental';
import { AppError, conflict, notFound } from '../utils/AppError';
import { logger } from '../utils/logger';
import { parseDateOnly } from '../utils/dates';
import { createInventoryBody, updateInventoryBody } from '../validators/inventory';
import { AuthUser } from '../interfaces/IUser';

type CreateInventoryInput = z.infer<typeof createInventoryBody>;
type UpdateInventoryInput = z.infer<typeof updateInventoryBody>;

/** Printed QR labels may encode "ELVI-XXXX|name|serial|price"; only the first segment identifies the item. */
export const parseQrCode = (raw: string) => raw.split('|')[0].trim();

const toDate = (value?: string) => (value ? parseDateOnly(value) : undefined);

class InventoryService {
    list() {
        return Inventory.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    }

    listArchived() {
        return Inventory.find({ isArchived: true }).sort({ archivedAt: -1 }).lean();
    }

    listDamaged() {
        return Inventory.find({ status: 'Damaged', isArchived: false }).sort({ updatedAt: -1 }).lean();
    }

    async getById(id: string) {
        const item = await Inventory.findById(id).lean();
        if (!item) throw notFound('Item');
        return item;
    }

    async getByQrCode(raw: string) {
        const item = await Inventory.findOne({ qrCodeId: parseQrCode(raw), isArchived: false }).lean();
        if (!item) throw new AppError(404, 'No inventory item matches this QR code', 'QR_NOT_FOUND');
        return item;
    }

    async create(input: CreateInventoryInput, actor: AuthUser) {
        if (await Inventory.exists({ serialNumber: input.serialNumber })) {
            throw conflict('An item with this serial number already exists');
        }

        const item = await Inventory.create({
            ...input,
            purchaseDate: toDate(input.purchaseDate),
            qrCodeId: `ELVI-${randomBytes(4).toString('hex').toUpperCase()}`,
        });
        logger.info({ event: 'inventory.created', itemId: item.id, by: actor.id }, 'Inventory item created');
        return item.toObject();
    }

    async update(id: string, input: UpdateInventoryInput, actor: AuthUser) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item');

        if (input.status && input.status !== item.status && item.status === 'Rented') {
            throw conflict('This item is out on rental. Its status changes when the rental is returned.');
        }

        const { purchaseDate, lastMaintenance, ...rest } = input;
        item.set(rest);
        if (purchaseDate !== undefined) item.purchaseDate = toDate(purchaseDate);
        if (lastMaintenance !== undefined) item.lastMaintenance = toDate(lastMaintenance);
        await item.save();

        logger.info({ event: 'inventory.updated', itemId: id, by: actor.id, fields: Object.keys(input) }, 'Inventory item updated');
        return item.toObject();
    }

    async archive(id: string, actor: AuthUser) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item');
        if (item.status === 'Rented') throw conflict('This item is out on rental and cannot be archived until it is returned.');

        item.isArchived = true;
        item.archivedAt = new Date();
        await item.save();
        logger.info({ event: 'inventory.archived', itemId: id, by: actor.id }, 'Inventory item archived');
        return { message: 'Item archived' };
    }

    async restore(id: string, actor: AuthUser) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item');
        item.isArchived = false;
        item.archivedAt = undefined;
        await item.save();
        logger.info({ event: 'inventory.restored', itemId: id, by: actor.id }, 'Inventory item restored');
        return { message: 'Item restored' };
    }

    /** Permanent delete is only allowed for items that were never rented, so history stays intact. */
    async remove(id: string, actor: AuthUser) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item');
        if (item.status === 'Rented') throw conflict('This item is out on rental and cannot be deleted.');
        if (await ProductRental.exists({ 'items.itemId': item._id, isDeleted: false })) {
            throw conflict('This item has rental history and cannot be deleted. Archive it instead.');
        }

        await item.deleteOne();
        logger.info({ event: 'inventory.deleted', itemId: id, by: actor.id }, 'Inventory item deleted');
        return { message: 'Item deleted permanently' };
    }
}

export default new InventoryService();
