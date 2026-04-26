const mongoose = require('mongoose');

const ProductRentalSchema = new mongoose.Schema({
  rentalId: { type: String, unique: true, default: () => `PR-${Date.now()}` },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, default: 1 }
  }],
  rentalDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  status: { type: String, enum: ['Rented', 'Returned', 'Overdue'], default: 'Rented' },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
  notes: String,
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.models.ProductRental || mongoose.model('ProductRental', ProductRentalSchema);



