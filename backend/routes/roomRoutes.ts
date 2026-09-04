import express, { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParam } from '../validation/common';
import { createRoomSchema, updateRoomSchema } from '../validation/schemas';
import { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/roomController';

const router: Router = express.Router();

router.use(protect);

router.get('/', getAllRooms);
router.get('/:id', validate({ params: idParam }), getRoomById);
router.post('/', adminOnly, validate({ body: createRoomSchema }), createRoom);
router.patch('/:id', adminOnly, validate({ params: idParam, body: updateRoomSchema }), updateRoom);
router.delete('/:id', adminOnly, validate({ params: idParam }), deleteRoom);

export default router;
