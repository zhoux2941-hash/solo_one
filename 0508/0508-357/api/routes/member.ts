import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { MemberPackage, ExpirationReminder } from '../../shared/types';

const router = Router();

const EXPIRATION_WARNING_DAYS = 7;

function calculateDaysRemaining(expireDate: string): number {
  const now = new Date();
  const expiration = new Date(expireDate);
  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

router.get('/packages', authMiddleware('member'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  const memberPackages = db
    .prepare(
      `SELECT mp.*, p.name as package_name
       FROM member_packages mp
       JOIN packages p ON mp.package_id = p.id
       WHERE mp.member_id = ? AND mp.remaining_classes > 0
       ORDER BY mp.expire_date ASC`
    )
    .all(member.id) as any[];

  const result: MemberPackage[] = memberPackages.map((mp) => {
    const daysRemaining = calculateDaysRemaining(mp.expire_date);
    return {
      id: mp.id,
      memberId: mp.member_id,
      packageId: mp.package_id,
      packageName: mp.package_name,
      remainingClasses: mp.remaining_classes,
      expireDate: mp.expire_date,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS,
      isExpired: daysRemaining < 0,
      daysRemaining,
      purchasedAt: mp.purchased_at,
    };
  });

  sendSuccess<MemberPackage[]>(res, result);
});

router.get('/expiration-reminders', authMiddleware('member'), (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const memberName = req.user!.name;

  const member = db
    .prepare('SELECT * FROM members WHERE user_id = ?')
    .get(userId) as any;

  if (!member) {
    return sendError(res, '会员信息不存在');
  }

  const memberPackages = db
    .prepare(
      `SELECT mp.*, p.name as package_name
       FROM member_packages mp
       JOIN packages p ON mp.package_id = p.id
       WHERE mp.member_id = ? AND mp.remaining_classes > 0
       ORDER BY mp.expire_date ASC`
    )
    .all(member.id) as any[];

  const packagesWithInfo: MemberPackage[] = memberPackages.map((mp) => {
    const daysRemaining = calculateDaysRemaining(mp.expire_date);
    return {
      id: mp.id,
      memberId: mp.member_id,
      packageId: mp.package_id,
      packageName: mp.package_name,
      remainingClasses: mp.remaining_classes,
      expireDate: mp.expire_date,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= EXPIRATION_WARNING_DAYS,
      isExpired: daysRemaining < 0,
      daysRemaining,
      purchasedAt: mp.purchased_at,
    };
  });

  const expiringPackages = packagesWithInfo.filter(
    (p) => p.isExpiringSoon || p.isExpired
  );
  
  const totalExpiringClasses = expiringPackages.reduce(
    (sum, p) => sum + p.remainingClasses,
    0
  );

  const result: ExpirationReminder = {
    memberId: member.id,
    memberName,
    packages: expiringPackages,
    totalExpiringClasses,
  };

  sendSuccess<ExpirationReminder>(res, result);
});

export function processExpiredPackages() {
  console.log('开始处理过期课时包...');

  const now = new Date().toISOString();

  const expiredPackages = db
    .prepare(
      `SELECT mp.*, m.user_id
       FROM member_packages mp
       JOIN members m ON mp.member_id = m.id
       WHERE mp.expire_date < ? AND mp.remaining_classes > 0`
    )
    .all(now) as any[];

  if (expiredPackages.length === 0) {
    console.log('没有需要处理的过期课时包');
    return;
  }

  let totalExpiredClasses = 0;

  for (const pkg of expiredPackages) {
    const transaction = db.transaction(() => {
      db.prepare(
        'UPDATE members SET remaining_classes = remaining_classes - ? WHERE id = ?'
      ).run(pkg.remaining_classes, pkg.member_id);

      db.prepare(
        'UPDATE member_packages SET remaining_classes = 0 WHERE id = ?'
      ).run(pkg.id);

      totalExpiredClasses += pkg.remaining_classes;
    });

    try {
      transaction();
      console.log(`处理过期课时包 ID: ${pkg.id}, 扣除课时: ${pkg.remaining_classes}`);
    } catch (error) {
      console.error(`处理过期课时包 ID: ${pkg.id} 失败:`, error);
    }
  }

  console.log(`过期课时包处理完成，共扣除 ${totalExpiredClasses} 课时`);
}

export default router;
