import mongoose, { Model, Schema } from 'mongoose';
import { IStudioRental } from '../interfaces/IStudioRental';
import { SIMPLE_PAYMENT_STATUSES, STUDIO_ROOMS, STUDIO_STATUSES } from '../config/constants';

const StudioRentalSchema = new Schema<IStudioRental>({
    bookingId: { type: String, unique: true, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    roomName: { type: String, enum: STUDIO_ROOMS, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationHours: { type: Number },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STUDIO_STATUSES, default: 'Confirmed' },
    paymentStatus: { type: String, enum: SIMPLE_PAYMENT_STATUSES, default: 'Pending' },
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, { timestamps: true });

StudioRentalSchema.index({ roomName: 1, startTime: 1, endTime: 1 });
StudioRentalSchema.index({ customer: 1, startTime: -1 });
StudioRentalSchema.index({ isDeleted: 1, isArchived: 1, startTime: -1 });

StudioRentalSchema.pre('validate', function () {
    if (this.startTime && this.endTime && this.endTime <= this.startTime) {
        this.invalidate('endTime', 'End time must be after the start time');
    }
});

// Keep the derived duration in sync whenever times change (only document.save() runs this hook).
StudioRentalSchema.pre('save', function () {
    if (this.startTime && this.endTime) {
        const diffMs = this.endTime.getTime() - this.startTime.getTime();
        this.durationHours = Math.round((diffMs / 3_600_000) * 100) / 100;
    }
});

const StudioRental = (mongoose.models.StudioRental as Model<IStudioRental>)
    || mongoose.model<IStudioRental>('StudioRental', StudioRentalSchema);
export default StudioRental;
