import { Router } from 'express';
import {
  batchSendNotifications,
  getNotificationsByStudent,
} from '../db.js';

const router = Router();

router.post('/batch', (req, res) => {
  const items = req.body as {
    studentId: string;
    clubId: number;
    title?: string;
    content?: string;
  }[];
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: '请选择要通知的学生' });
    return;
  }
  const normalized = items.map((item) => ({
    studentId: item.studentId,
    clubId: item.clubId,
    title: item.title || '录取通知',
    content: item.content || '恭喜你已通过面试，正式加入社团！',
  }));
  const created = batchSendNotifications(normalized);
  res.json({ success: true, count: created.length });
});

router.get('/my', (req, res) => {
  const studentId = req.query.studentId as string | undefined;
  if (!studentId) {
    res.status(400).json({ success: false, error: '缺少学号' });
    return;
  }
  const list = getNotificationsByStudent(studentId);
  res.json({ success: true, notifications: list });
});

export default router;
