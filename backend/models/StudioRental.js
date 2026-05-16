const mongoose = require('mongoose');

const StudioRentalSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true, default: () => `SR-${Date.now()}` },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    roomName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationHours: { type: Number },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    notes: String,
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate duration before save
StudioRentalSchema.pre('save', async function () {
    if (this.startTime && this.endTime) {
        const diffMs = new Date(this.endTime) - new Date(this.startTime);
        this.durationHours = parseFloat((diffMs / 3600000).toFixed(2));
    }
});

module.exports = mongoose.models.StudioRental || mongoose.model('StudioRental', StudioRentalSchema);