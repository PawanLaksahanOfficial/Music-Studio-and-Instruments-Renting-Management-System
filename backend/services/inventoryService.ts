import { v4 as uuidv4 } from 'uuid';
import Inventory from '../models/Inventory';
import { IInventory } from '../interfaces/IInventory';

class InventoryService {
    async getAllInventory(): Promise<IInventory[]> {
        return await Inventory.find({ isArchived: false }).sort({ createdAt: -1 });
    }

    async getInventoryByQRCode(qrCodeId: string): Promise<IInventory> {
        const parsedId = qrCodeId.split('|')[0].trim();
        const item = await Inventory.findOne({ qrCodeId: parsedId });
        if (!item) {
            const error: any = new Error('No item found for this QR code');
            error.statusCode = 404;
            throw error;
        }
        return item;
    }

    async getInventoryById(id: string): Promise<IInventory> {
        const item = await Inventory.findById(id);
        if (!item) {
            const error: any = new Error('Item not found');
            error.statusCode = 404;
            throw error;
        }
        return item;
    }

    async createInventoryItem(data: any): Promise<IInventory> {
        const { itemName, category, brand, itemModel, serialNumber, status, baseRentalPrice, purchaseDate } = data;
        
        if (!itemName || !category || !serialNumber || baseRentalPrice === undefined) {
            const error: any = new Error('itemName, category, serialNumber and baseRentalPrice are required');
            error.statusCode = 400;
            throw error;
        }

        const existing = await Inventory.findOne({ serialNumber });
        if (existing) {
            const error: any = new Error('An item with this serial number already exists');
            error.statusCode = 409;
            throw error;
        }

        const qrCodeId = `ELVI-${uuidv4().split('-')[0].toUpperCase()}`;
        
        return await Inventory.create({
            itemName, category, brand, itemModel, serialNumber,
            qrCodeId, status, baseRentalPrice, purchaseDate,
        });
    }

    async updateInventoryItem(id: string, updateData: any): Promise<IInventory> {
        const allowed = ['itemName','category','brand','itemModel','serialNumber','status','baseRentalPrice','purchaseDate','lastMaintenance'];
        const updates: any = {};
        allowed.forEach(f => { if (updateData[f] !== undefined) updates[f] = updateData[f]; });

        const item = await Inventory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!item) {
            const error: any = new Error('Item not found');
            error.statusCode = 404;
            throw error;
        }
        return item;
    }

    async archiveInventoryItem(id: string): Promise<{ message: string }> {
        const item = await Inventory.findById(id);
        if (!item) {
            const error: any = new Error('Item not found');
            error.statusCode = 404;
            throw error;
        }
        item.isArchived = true;
        item.archivedAt = new Date();
        await item.save();
        return { message: 'Item archived' };
    }

    async restoreInventoryItem(id: string): Promise<{ message: string }> {
        const item = await Inventory.findById(id);
        if (!item) {
            const error: any = new Error('Item not found');
            error.statusCode = 404;
            throw error;
        }
        item.isArchived = false;
        item.archivedAt = undefined;
        await item.save();
        return { message: 'Item restored' };
    }

    async deleteInventoryItem(id: string): Promise<{ message: string }> {
        const item = await Inventory.findById(id);
        if (!item) {
            const error: any = new Error('Item not found');
            error.statusCode = 404;
            throw error;
        }
        
        if (item.status === 'Rented') {
            const error: any = new Error('Cannot delete an item that is currently rented out');
            error.statusCode = 400;
            throw error;
        }

        await item.deleteOne();
        return { message: 'Item deleted permanently' };
    }

    async getArchivedInventory(): Promise<IInventory[]> {
        return await Inventory.find({ isArchived: true }).sort({ archivedAt: -1 });
    }

    async getDamagedInventory(): Promise<IInventory[]> {
        return await Inventory.find({ status: 'Damaged', isArchived: false }).sort({ updatedAt: -1 });
    }
}

export default new InventoryService();
