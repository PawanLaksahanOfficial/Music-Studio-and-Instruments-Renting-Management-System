const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, sparse: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    address: String,
    nicOrPassport: { type: String, unique: true, required: true, trim: true },
    rentalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductRental' }],
    isBlacklisted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);