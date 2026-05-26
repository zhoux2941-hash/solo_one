import cron from 'node-cron';
import db from '../db';
import { processExpiredPackages } from '../routes/member.js';

export function processMonthlySettlement() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${lastDayOfMonth.getDate()}`;

  console.log(`开始处理 ${monthStr} 的月度结算...`);

  const coaches = db.prepare('SELECT id FROM coaches').all() as { id: number }[];

  for (const coach of coaches) {
    const transaction = db.transaction(() => {
      const existingSettlement = db
        .prepare('SELECT id FROM settlements WHERE coach_id = ? AND month = ?')
        .get(coach.id, monthStr);

      if (existingSettlement) {
        console.log(`教练 ${coach.id} 的 ${monthStr} 结算已存在，跳过`);
        return;
      }

      const earnings = db
        .prepare(
          `SELECT COUNT(*) as total_classes, COALESCE(SUM(amount), 0) as total_amount
           FROM earnings 
           WHERE coach_id = ? 
           AND strftime('%Y-%m', class_date) = ?
           AND settlement_id IS NULL`
        )
        .get(coach.id, monthStr) as { total_classes: number; total_amount: number };

      if (earnings.total_classes === 0) {
        console.log(`教练 ${coach.id} ${monthStr} 无课时记录，跳过`);
        return;
      }

      const result = db
        .prepare(
          'INSERT INTO settlements (coach_id, month, start_date, end_date, total_classes, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(coach.id, monthStr, startDate, endDate, earnings.total_classes, earnings.total_amount, 'pending');

      const settlementId = result.lastInsertRowid;

      db.prepare(
        `UPDATE earnings 
         SET settlement_id = ? 
         WHERE coach_id = ? 
         AND strftime('%Y-%m', class_date) = ?
         AND settlement_id IS NULL`
      ).run(settlementId, coach.id, monthStr);

      console.log(
        `教练 ${coach.id} ${monthStr} 结算完成：${earnings.total_classes} 节课，${earnings.total_amount} 元`
      );
    });

    try {
      transaction();
    } catch (error) {
      console.error(`教练 ${coach.id} ${monthStr} 结算失败:`, error);
    }
  }

  console.log(`${monthStr} 月度结算处理完成`);
}

export function initCronJobs() {
  const settlementTask = cron.schedule('0 0 1 * *', () => {
    console.log('触发月度结算定时任务');
    processMonthlySettlement();
  });

  const expirationTask = cron.schedule('0 0 * * *', () => {
    console.log('触发过期课时包处理定时任务');
    processExpiredPackages();
  });

  console.log('定时任务已启动：每月1号0点自动执行月度结算，每天0点自动处理过期课时包');

  return { settlementTask, expirationTask };
}
