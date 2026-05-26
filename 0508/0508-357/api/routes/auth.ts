import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { LoginRequest, LoginResponse, User, MemberProfile } from '../../shared/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'booking-system-secret-key';

router.post('/login', (req, res) => {
  const { phone, password, role } = req.body as LoginRequest;

  if (!phone || !password || !role) {
    return sendError(res, '请填写完整的登录信息');
  }

  const user = db
    .prepare('SELECT * FROM users WHERE phone = ? AND role = ?')
    .get(phone, role) as any;

  if (!user) {
    return sendError(res, '用户不存在或角色错误');
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {
    return sendError(res, '密码错误');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const userData: User = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.created_at,
  };

  let memberProfile: MemberProfile | undefined;

  if (role === 'member') {
    const member = db
      .prepare('SELECT * FROM members WHERE user_id = ?')
      .get(user.id) as any;

    if (member) {
      const totalPurchased = db
        .prepare(
          'SELECT COALESCE(SUM(classes), 0) as total FROM packages p JOIN member_packages mp ON p.id = mp.package_id WHERE mp.member_id = ?'
        )
        .get(member.id) as { total: number };

      const totalUsed = db
        .prepare(
          "SELECT COUNT(*) as total FROM bookings WHERE member_id = ? AND status = 'completed'"
        )
        .get(member.id) as { total: number };

      memberProfile = {
        userId: user.id,
        memberId: member.id,
        remainingClasses: member.remaining_classes,
        totalPurchased: totalPurchased.total,
        totalUsed: totalUsed.total,
      };
    }
  }

  sendSuccess<LoginResponse>(res, {
    token,
    user: userData,
    memberProfile,
  });
});

router.get('/me', authMiddleware(), (req: any, res) => {
  const user = db
    .prepare('SELECT id, phone, name, role, avatar, created_at FROM users WHERE id = ?')
    .get(req.user.userId) as any;

  if (!user) {
    return sendError(res, '用户不存在', 404);
  }

  const userData: User = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.created_at,
  };

  sendSuccess<User>(res, userData);
});

export default router;
