const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  type: { type: String, enum: ['Routine', 'Damage Repair'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  description: String,
  cost: Number,
  resolvedAt: Date,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);