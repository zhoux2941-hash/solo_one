import { Router } from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { Coach, TimeSlot } from '../../shared/types';
import { conflictCheckService } from '../services/ConflictCheckService.js';

const router = Router();

const TIME_SLOTS = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:30', endTime: '11:30' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:30', endTime: '16:30' },
  { startTime: '17:00', endTime: '18:00' },
  { startTime: '18:30', endTime: '19:30' },
];

router.get('/', authMiddleware('member'), (req, res) => {
  const coaches = db
    .prepare(
      `SELECT c.id, c.user_id, c.specialty, c.bio, c.rating, c.total_classes,
              u.name, u.avatar
       FROM coaches c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.rating DESC`
    )
    .all() as any[];

  const result: Coach[] = coaches.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    avatar: c.avatar,
    specialty: c.specialty,
    bio: c.bio,
    rating: c.rating,
    totalClasses: c.total_classes,
  }));

  sendSuccess<Coach[]>(res, result);
});

router.get('/:id/available-slots', authMiddleware('member'), async (req, res) => {
  const coachId = parseInt(req.params.id);
  const { date } = req.query;

  let targetDate = date as string;
  if (!targetDate) {
    targetDate = dayjs().format('YYYY-MM-DD');
  }

  const slots = await conflictCheckService.getAvailableSlots(
    coachId,
    targetDate,
    TIME_SLOTS
  );

  const result: TimeSlot[] = slots.map((slot) => ({
    date: targetDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.isAvailable,
  }));

  sendSuccess<TimeSlot[]>(res, result);
});

export default router;
