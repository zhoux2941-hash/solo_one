import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { Package } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware('member'), (req, res) => {
  const packages = db
    .prepare('SELECT * FROM packages ORDER BY classes')
    .all() as any[];

  const result: Package[] = packages.map((p) => ({
    id: p.id,
    name: p.name,
    classes: p.classes,
    price: p.price,
    originalPrice: p.original_price,
    validityDays: p.validity_days,
    description: p.description,
    isRecommended: !!p.is_recommended,
  }));

  sendSuccess<Package[]>(res, result);
});

router.post('/:id/purchase', authMiddleware('member'), (req: AuthRequest, res) => {
  const packageId = parseInt(req.params.id);
  const userId = req.user!.userId;

  const packageData = db
    .prepare('SELECT * FROM packages WHERE id = ?')
    .get(packageId) as any;

  if (!packageData) {
    return sendError(res, '课时包不存在');
  }

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  const transaction = db.transaction(() => {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + packageData.validity_days);

    db.prepare(
      'INSERT INTO member_packages (member_id, package_id, remaining_classes, expire_date) VALUES (?, ?, ?, ?)'
    ).run(member.id, packageId, packageData.classes, expireDate.toISOString());

    db.prepare(
      'UPDATE members SET remaining_classes = remaining_classes + ? WHERE id = ?'
    ).run(packageData.classes, member.id);
  });

  try {
    transaction();
    sendSuccess(res, undefined, '购买成功');
  } catch (error) {
    sendError(res, '购买失败，请重试');
  }
});

export default router;
