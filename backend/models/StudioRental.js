const mongoose = require('mongoose');

const StudioRentalSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true, default: () => `SR-${Date.now()}` },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  roomName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationHours: Number,
  totalAmount: Number,
  status: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
  paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('StudioRental', StudioRentalSchema);