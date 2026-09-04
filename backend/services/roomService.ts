import Room from '../models/Room';
import StudioRental from '../models/StudioRental';
import { badRequest, conflict, notFound } from '../utils/AppError';

interface RoomInput {
    name: string;
    hourlyRate: number;
    capacity?: number;
    description?: string;
    isActive?: boolean;
}

class RoomService {
    async getAllRooms(includeInactive = false) {
        const filter = includeInactive ? {} : { isActive: true };
        return Room.find(filter).sort({ name: 1 }).lean();
    }

    async getRoomById(id: string) {
        const room = await Room.findById(id);
        if (!room) throw notFound('Room not found');
        return room;
    }

    async createRoom(data: RoomInput) {
        const existing = await Room.findOne({ name: data.name });
        if (existing) throw conflict('A room with that name already exists');
        return Room.create(data);
    }

    async updateRoom(id: string, updates: Partial<RoomInput>) {
        const room = await Room.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
        if (!room) throw notFound('Room not found');
        return room;
    }

    async deleteRoom(id: string) {
        const bookingCount = await StudioRental.countDocuments({ room: id });
        if (bookingCount > 0) {
            throw badRequest(
                `This room has ${bookingCount} booking${bookingCount === 1 ? '' : 's'} — deactivate it instead of deleting`
            );
        }
        const room = await Room.findByIdAndDelete(id);
        if (!room) throw notFound('Room not found');
        return { message: 'Room deleted' };
    }
}

export default new RoomService();
