import mongoose, { Model, Schema } from 'mongoose';

/**
 * One document per studio room. Booking writes increment it inside their transaction, so two
 * concurrent bookings for the same room conflict and are serialized instead of double-booking.
 */
interface IRoomLock {
    _id: string;
    version: number;
}

const RoomLockSchema = new Schema<IRoomLock>({
    _id: { type: String, required: true },
    version: { type: Number, default: 0 },
}, { versionKey: false });

const RoomLock = (mongoose.models.RoomLock as Model<IRoomLock>) || mongoose.model<IRoomLock>('RoomLock', RoomLockSchema);
export default RoomLock;
