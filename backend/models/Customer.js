const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String, required: true },
  address: String,
  nicOrPassport: { type: String, unique: true, required: true },
  rentalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
  isBlacklisted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);