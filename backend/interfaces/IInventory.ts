import { Document } from 'mongoose';

export type InventoryStatus = 'Available' | 'Rented' | 'Maintenance' | 'Damaged' | 'Lost';
export type InventoryCategory = 'Instruments' | 'Audio Gear' | 'Cables' | 'Other';

export interface IInventory extends Document {
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
    specifications?: Map<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
