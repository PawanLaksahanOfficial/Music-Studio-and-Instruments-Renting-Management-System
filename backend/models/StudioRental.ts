import mongoose, { Schema, Model } from 'mongoose';
import { IStudioRental } from '../interfaces/IStudioRental';

const StudioRentalSchema: Schema<IStudioRental> = new Schema(
    {
        // Assigned from an atomic counter in the service layer.
        bookingId: { type: String, unique: true, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        roomName: { type: String, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        durationHours: { type: Number, required: true, min: 0 },
        hourlyRate: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
        paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
        notes: String,
        isDeleted: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
    },
    { timestamps: true }
);

StudioRentalSchema.index({ isDeleted: 1, isArchived: 1, startTime: -1 });
StudioRentalSchema.index({ customer: 1, startTime: -1 });
// Backs the overlap query that guards against double-booking.
StudioRentalSchema.index({ room: 1, status: 1, startTime: 1, endTime: 1 });
StudioRentalSchema.index({ isArchived: 1, archivedAt: -1 });

const StudioRental: Model<IStudioRental> =
    mongoose.models.StudioRental || mongoose.model<IStudioRental>('StudioRental', StudioRentalSchema);
export default StudioRental;
