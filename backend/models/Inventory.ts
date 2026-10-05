import mongoose, { Model, Schema } from 'mongoose';
import { IInventory } from '../interfaces/IInventory';
import { INVENTORY_CATEGORIES, INVENTORY_STATUSES } from '../config/constants';

const InventorySchema = new Schema<IInventory>({
    itemName: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: INVENTORY_CATEGORIES, required: true },
    brand: { type: String, trim: true, maxlength: 60 },
    itemModel: { type: String, trim: true, maxlength: 60 },
    serialNumber: { type: String, unique: true, required: true, trim: true, maxlength: 60 },
    qrCodeId: { type: String, unique: true, required: true },
    status: { type: String, enum: INVENTORY_STATUSES, default: 'Available' },
    baseRentalPrice: { type: Number, required: true, min: 0 },
    purchaseDate: Date,
    lastMaintenance: Date,
    notes: { type: String, trim: true, maxlength: 500 },
    specifications: { type: Map, of: String },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, { timestamps: true });

InventorySchema.index({ status: 1, isArchived: 1 });
InventorySchema.index({ isArchived: 1, createdAt: -1 });

const Inventory = (mongoose.models.Inventory as Model<IInventory>) || mongoose.model<IInventory>('Inventory', InventorySchema);
export default Inventory;
