import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRoom extends Document {
    name: string;
    hourlyRate: number;
    capacity?: number;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Studio rooms were previously free-text on the booking, so a typo created a
 * phantom room that conflicted with nothing and could be double-booked.
 * Bookings now reference a room, and its `hourlyRate` prices them server-side.
 */
const RoomSchema: Schema<IRoom> = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        hourlyRate: { type: Number, required: true, min: 0 },
        capacity: { type: Number, min: 1 },
        description: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

RoomSchema.index({ isActive: 1, name: 1 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export default Room;
