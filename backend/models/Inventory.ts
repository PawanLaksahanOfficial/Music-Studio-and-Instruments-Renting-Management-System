import mongoose, { Schema, Model } from 'mongoose';
import { IInventory } from '../interfaces/IInventory';

const InventorySchema: Schema<IInventory> = new Schema({
    itemName: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Instruments', 'Audio Gear', 'Cables', 'Other'], required: true },
    brand: String,
    itemModel: { type: String },
    serialNumber: { type: String, unique: true, required: true, trim: true },
    qrCodeId: { type: String, unique: true, required: true },
    status: { type: String, enum: ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'], default: 'Available' },
    baseRentalPrice:{ type: Number, required: true, min: 0 },
    purchaseDate: Date,
    lastMaintenance: Date,
    specifications: { type: Map, of: String }
}, { timestamps: true });

const Inventory: Model<IInventory> = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
export default Inventory;
