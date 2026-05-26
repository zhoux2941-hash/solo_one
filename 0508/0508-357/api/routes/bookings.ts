import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { Booking, CreateBookingRequest } from '../../shared/types';
import { conflictCheckService } from '../services/ConflictCheckService.js';

const router = Router();

router.post('/', authMiddleware('member'), async (req: AuthRequest, res) => {
  const { coachId, date, startTime, endTime } = req.body as CreateBookingRequest;
  const userId = req.user!.userId;

  if (!coachId || !date || !startTime || !endTime) {
    return sendError(res, '请填写完整的预约信息');
  }

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  if (member.remaining_classes <= 0) {
    return sendError(res, '剩余课时不足，请先购买课时包');
  }

  const coach = db
    .prepare(
      'SELECT c.*, u.name as coach_name FROM coaches c JOIN users u ON c.user_id = u.id WHERE c.id = ?'
    )
    .get(coachId) as any;

  if (!coach) {
    return sendError(res, '教练不存在');
  }

  const memberName = req.user!.name;

  try {
    await conflictCheckService.withBookingLock(
      coachId,
      date,
      startTime,
      async () => {
        const transaction = db.transaction(() => {
          db.prepare(
            `INSERT INTO bookings (member_id, member_name, coach_id, coach_name, date, start_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
          ).run(
            member.id,
            memberName,
            coachId,
            coach.coach_name,
            date,
            startTime,
            endTime
          );

          db.prepare(
            'UPDATE members SET remaining_classes = remaining_classes - 1 WHERE id = ?'
          ).run(member.id);
        });

        transaction();
      }
    );

    sendSuccess(res, undefined, '预约成功');
  } catch (error: any) {
    if (error.message.includes('该时段已被预约')) {
      return sendError(res, error.message);
    }
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return sendError(res, '该时段已被预约，请选择其他时段');
    }
    if (error.message.includes('系统繁忙')) {
      return sendError(res, error.message);
    }
    console.error('预约失败:', error);
    sendError(res, '预约失败，请重试');
  }
});

router.get('/member', authMiddleware('member'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  const bookings = db
    .prepare(
      `SELECT * FROM bookings 
       WHERE member_id = ? 
       ORDER BY date DESC, start_time DESC`
    )
    .all(member.id) as any[];

  const result: Booking[] = bookings.map((b) => ({
    id: b.id,
    memberId: b.member_id,
    memberName: b.member_name,
    coachId: b.coach_id,
    coachName: b.coach_name,
    date: b.date,
    startTime: b.start_time,
    endTime: b.end_time,
    status: b.status,
    startedAt: b.started_at,
    completedAt: b.completed_at,
    createdAt: b.created_at,
  }));

  sendSuccess<Booking[]>(res, result);
});

router.get('/coach', authMiddleware('coach'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { date } = req.query;

  const coach = db
    .prepare('SELECT * FROM coaches WHERE user_id = ?')
    .get(userId) as any;

  if (!coach) {
    return sendError(res, '教练信息不存在');
  }

  let sql = `SELECT * FROM bookings WHERE coach_id = ?`;
  const params: any[] = [coach.id];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }

  sql += ' ORDER BY date DESC, start_time DESC';

  const bookings = db.prepare(sql).all(...params) as any[];

  const result: Booking[] = bookings.map((b) => ({
    id: b.id,
    memberId: b.member_id,
    memberName: b.member_name,
    coachId: b.coach_id,
    coachName: b.coach_name,
    date: b.date,
    startTime: b.start_time,
    endTime: b.end_time,
    status: b.status,
    startedAt: b.started_at,
    completedAt: b.completed_at,
    createdAt: b.created_at,
  }));

  sendSuccess<Booking[]>(res, result);
});

router.patch('/:id/start', authMiddleware('coach'), (req: AuthRequest, res) => {
  const bookingId = parseInt(req.params.id);
  const userId = req.user!.userId;

  const coach = db
    .prepare('SELECT * FROM coaches WHERE user_id = ?')
    .get(userId) as any;

  if (!coach) {
    return sendError(res, '教练信息不存在');
  }

  const booking = db
    .prepare('SELECT * FROM bookings WHERE id = ? AND coach_id = ?')
    .get(bookingId, coach.id) as any;

  if (!booking) {
    return sendError(res, '预约不存在或不属于您');
  }

  if (booking.status !== 'pending') {
    return sendError(res, '只有待上课的预约才能开始');
  }

  db.prepare(
    "UPDATE bookings SET status = 'in-progress', started_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), bookingId);

  sendSuccess(res, undefined, '课程已开始');
});

router.patch('/:id/complete', authMiddleware('coach'), async (req: AuthRequest, res) => {
  const bookingId = parseInt(req.params.id);
  const userId = req.user!.userId;

  const coach = db
    .prepare('SELECT * FROM coaches WHERE user_id = ?')
    .get(userId) as any;

  if (!coach) {
    return sendError(res, '教练信息不存在');
  }

  const booking = db
    .prepare('SELECT * FROM bookings WHERE id = ? AND coach_id = ?')
    .get(bookingId, coach.id) as any;

  if (!booking) {
    return sendError(res, '预约不存在或不属于您');
  }

  if (booking.status !== 'in-progress') {
    return sendError(res, '只有进行中的课程才能消课');
  }

  const transaction = db.transaction(() => {
    db.prepare(
      "UPDATE bookings SET status = 'completed', completed_at = ? WHERE id = ?"
    ).run(new Date().toISOString(), bookingId);

    db.prepare(
      'INSERT INTO earnings (coach_id, booking_id, member_name, amount, class_date) VALUES (?, ?, ?, 50, ?)'
    ).run(coach.id, bookingId, booking.member_name, booking.date);

    db.prepare(
      'UPDATE coaches SET total_classes = total_classes + 1 WHERE id = ?'
    ).run(coach.id);
  });

  try {
    transaction();
    
    await conflictCheckService.clearCache(
      coach.id,
      booking.date,
      booking.start_time
    );
    
    sendSuccess(res, undefined, '消课成功，已扣除1课时');
  } catch (error) {
    console.error('消课失败:', error);
    sendError(res, '消课失败，请重试');
  }
});

router.delete('/:id', authMiddleware('member'), async (req: AuthRequest, res) => {
  const bookingId = parseInt(req.params.id);
  const userId = req.user!.userId;

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  const booking = db
    .prepare('SELECT * FROM bookings WHERE id = ? AND member_id = ?')
    .get(bookingId, member.id) as any;

  if (!booking) {
    return sendError(res, '预约不存在或不属于您');
  }

  if (booking.status !== 'pending') {
    return sendError(res, '只有待上课的预约才能取消');
  }

  const transaction = db.transaction(() => {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(
      bookingId
    );

    db.prepare(
      'UPDATE members SET remaining_classes = remaining_classes + 1 WHERE id = ?'
    ).run(member.id);
  });

  try {
    transaction();
    
    await conflictCheckService.clearCache(
      booking.coach_id,
      booking.date,
      booking.start_time
    );
    
    sendSuccess(res, undefined, '预约已取消，课时已返还');
  } catch (error) {
    console.error('取消预约失败:', error);
    sendError(res, '取消失败，请重试');
  }
});

export default router;
