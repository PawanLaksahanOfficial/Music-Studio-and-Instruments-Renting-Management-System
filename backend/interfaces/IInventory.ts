import { Types } from 'mongoose';
import { INVENTORY_CATEGORIES, INVENTORY_STATUSES } from '../config/constants';

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export interface IInventory {
    _id: Types.ObjectId;
    itemName: string;
    category: InventoryCategory;
    brand?: string;
    itemModel?: string;
    serialNumber: string;
    qrCodeId: string;
    status: InventoryStatus;
    baseRentalPrice: number;
    purchaseDate?: Date;
    lastMaintenance?: Date;
    notes?: string;
    specifications?: Map<string, string>;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
