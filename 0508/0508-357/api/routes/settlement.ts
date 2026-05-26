import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { Earning, Settlement } from '../../shared/types';

const router = Router();

router.get('/earnings', authMiddleware('coach'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const coach = db
    .prepare('SELECT * FROM coaches WHERE user_id = ?')
    .get(userId) as any;

  if (!coach) {
    return sendError(res, '教练信息不存在');
  }

  const earnings = db
    .prepare(
      `SELECT e.*, b.start_time, b.end_time
       FROM earnings e
       LEFT JOIN bookings b ON e.booking_id = b.id
       WHERE e.coach_id = ?
       ORDER BY e.class_date DESC, e.created_at DESC`
    )
    .all(coach.id) as any[];

  const result: Earning[] = earnings.map((e) => ({
    id: e.id,
    coachId: e.coach_id,
    bookingId: e.booking_id,
    memberName: e.member_name,
    amount: e.amount,
    classDate: e.class_date,
    startTime: e.start_time,
    endTime: e.end_time,
    settlementId: e.settlement_id,
    createdAt: e.created_at,
  }));

  sendSuccess<Earning[]>(res, result);
});

router.get('/settlements', authMiddleware('coach'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const coach = db
    .prepare('SELECT * FROM coaches WHERE user_id = ?')
    .get(userId) as any;

  if (!coach) {
    return sendError(res, '教练信息不存在');
  }

  const settlements = db
    .prepare(
      `SELECT * FROM settlements 
       WHERE coach_id = ? 
       ORDER BY month DESC`
    )
    .all(coach.id) as any[];

  const result: Settlement[] = settlements.map((s) => ({
    id: s.id,
    coachId: s.coach_id,
    month: s.month,
    startDate: s.start_date || `${s.month}-01`,
    endDate: s.end_date || `${s.month}-28`,
    totalClasses: s.total_classes,
    totalAmount: s.total_amount,
    status: s.status,
    createdAt: s.created_at,
  }));

  sendSuccess<Settlement[]>(res, result);
});

export default router;
