const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  instrument_name: { type: String, required: true },
  category: String,
  brand: String,
  model: String,
  serial_number: { type: String, unique: true },
  condition: { type: String, enum: ['Good', 'Damaged'], default: 'Good' },
  status: { type: String, enum: ['Available', 'Rented', 'Maintenance'], default: 'Available' },
  rental_price_per_day: { type: Number, required: true },
  qr_code: { type: String, unique: true },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);