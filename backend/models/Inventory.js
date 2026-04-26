const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, enum: ['Instruments', 'Audio Gear', 'Cables', 'Other'], required: true },
  brand: String,
  model: String,
  serialNumber: { type: String, unique: true, required: true },
  qrCodeId: { type: String, unique: true, required: true },
  status: { 
    type: String, 
    enum: ['Available', 'Rented', 'Maintenance', 'Damaged', 'Lost'], 
    default: 'Available' 
  },
  baseRentalPrice: { type: Number, required: true },
  purchaseDate: Date,
  lastMaintenance: Date,
  specifications: Map
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);



