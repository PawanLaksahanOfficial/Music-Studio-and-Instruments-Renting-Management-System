import { v4 as uuidv4 } from 'uuid';
import Inventory from '../models/Inventory';
import ProductRental from '../models/ProductRental';
import { IInventory } from '../interfaces/IInventory';
import { badRequest, conflict, notFound } from '../utils/AppError';
import { paginate, searchFilter, Paginated } from '../utils/paginate';

const SEARCH_FIELDS = ['itemName', 'serialNumber', 'brand', 'itemModel'];

interface ListOptions {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category?: string;
}

interface InventoryInput {
    itemName: string;
    category: string;
    brand?: string;
    itemModel?: string;
    serialNumber: string;
    status?: string;
    baseRentalPrice: number;
    purchaseDate?: Date;
    lastMaintenance?: Date;
    notes?: string;
}

class InventoryService {
    async getAllInventory(opts: ListOptions): Promise<Paginated<IInventory>> {
        const filter: Record<string, unknown> = { isArchived: false };
        if (opts.status && opts.status !== 'All') filter.status = opts.status;
        if (opts.category && opts.category !== 'All') filter.category = opts.category;
        // Search runs in the database rather than in the browser, so the client
        // no longer has to hold the whole collection to filter it.
        if (opts.search) Object.assign(filter, searchFilter(opts.search, SEARCH_FIELDS));

        return paginate(Inventory, { filter, page: opts.page, limit: opts.limit, sort: { createdAt: -1 } });
    }

    async getArchivedInventory(opts: { page: number; limit: number; search?: string }) {
        const filter: Record<string, unknown> = { isArchived: true };
        if (opts.search) Object.assign(filter, searchFilter(opts.search, SEARCH_FIELDS));
        return paginate(Inventory, { filter, page: opts.page, limit: opts.limit, sort: { archivedAt: -1 } });
    }

    async getDamagedInventory(opts: { page: number; limit: number }) {
        return paginate(Inventory, {
            filter: { status: 'Damaged', isArchived: false },
            page: opts.page,
            limit: opts.limit,
            sort: { updatedAt: -1 },
        });
    }

    async getInventoryByQRCode(qrCodeId: string): Promise<IInventory> {
        // Scanners may return the whole encoded payload; the id is the first field.
        const parsedId = qrCodeId.split('|')[0].trim();
        const item = await Inventory.findOne({ qrCodeId: parsedId });
        if (!item) throw notFound('No item found for this QR code');
        return item;
    }

    async getInventoryById(id: string): Promise<IInventory> {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');
        return item;
    }

    async createInventoryItem(data: InventoryInput): Promise<IInventory> {
        const existing = await Inventory.findOne({ serialNumber: data.serialNumber });
        if (existing) throw conflict('An item with this serial number already exists');

        return Inventory.create({
            ...data,
            qrCodeId: `ELVI-${uuidv4().split('-')[0].toUpperCase()}`,
        });
    }

    async updateInventoryItem(id: string, updates: Partial<InventoryInput>): Promise<IInventory> {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');

        // Status is derived from rental activity while an item is out, so
        // hand-editing it would desynchronise it from the open rental.
        if (updates.status && item.status === 'Rented' && updates.status !== 'Rented') {
            throw badRequest('This item is out on rental — process its return to change the status');
        }
        // The serial number is the physical identity of the unit and is
        // referenced by past rentals, so it is fixed after creation.
        Object.assign(item, { ...updates, serialNumber: item.serialNumber });
        await item.save();
        return item;
    }

    async archiveInventoryItem(id: string) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');
        if (item.status === 'Rented') throw badRequest('Cannot archive an item that is currently rented out');

        item.isArchived = true;
        item.archivedAt = new Date();
        await item.save({ validateModifiedOnly: true });
        return { message: 'Item archived' };
    }

    async restoreInventoryItem(id: string) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');
        item.isArchived = false;
        item.archivedAt = undefined;
        await item.save({ validateModifiedOnly: true });
        return { message: 'Item restored' };
    }

    async deleteInventoryItem(id: string) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');
        if (item.status === 'Rented') throw badRequest('Cannot delete an item that is currently rented out');

        // Deleting an item referenced by rental history would leave those
        // rentals pointing at nothing and silently break reporting.
        const referenced = await ProductRental.countDocuments({ 'items.itemId': id });
        if (referenced > 0) {
            throw badRequest(
                `This item appears on ${referenced} rental record${referenced === 1 ? '' : 's'} — archive it instead of deleting`
            );
        }

        await item.deleteOne();
        return { message: 'Item deleted permanently' };
    }

    /** Marks a damaged item repaired and returns it to circulation. */
    async markRepaired(id: string) {
        const item = await Inventory.findById(id);
        if (!item) throw notFound('Item not found');
        if (item.status !== 'Damaged' && item.status !== 'Maintenance') {
            throw badRequest('Only damaged or in-maintenance items can be marked repaired');
        }
        item.status = 'Available';
        item.lastMaintenance = new Date();
        await item.save({ validateModifiedOnly: true });
        return item;
    }
}

export default new InventoryService();
