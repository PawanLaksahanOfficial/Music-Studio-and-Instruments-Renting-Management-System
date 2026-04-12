const mongoose = require('mongoose');

const ProductRentalSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  instrument_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  rental_date: { type: Date, default: Date.now },
  return_date: Date,
  due_date: { type: Date, required: true },
  rental_status: { type: String, enum: ['Rented', 'Returned'], default: 'Rented' },
  total_amount: Number,
  payment_status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('ProductRental', ProductRentalSchema);