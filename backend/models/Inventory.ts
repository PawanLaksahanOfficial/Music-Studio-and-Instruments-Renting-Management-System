import mongoose, { Schema, Model } from 'mongoose';
import { IInventory } from '../interfaces/IInventory';

const InventorySchema: Schema<IInventory> = new Schema(
    {
        itemName: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ['Instruments', 'Audio Gear', 'Cables', 'Other'],
            required: true,
        },
        brand: { type: String, trim: true },
        itemModel: { type: String, trim: true },
        serialNumber: { type: String, unique: true, required: true, trim: true },
        qrCodeId: { type: String, unique: true, required: true },
        status: {
            type: String,
            enum: ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'],
            default: 'Available',
        },
        baseRentalPrice: { type: Number, required: true, min: 0 },
        purchaseDate: Date,
        lastMaintenance: Date,
        specifications: { type: Map, of: String },
        notes: { type: String, trim: true },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
    },
    { timestamps: true }
);

InventorySchema.index({ isArchived: 1, status: 1 });
InventorySchema.index({ isArchived: 1, category: 1 });
// Backs server-side search across the fields the UI searches on.
InventorySchema.index({ itemName: 'text', brand: 'text', serialNumber: 'text' });

const Inventory: Model<IInventory> =
    mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
export default Inventory;
