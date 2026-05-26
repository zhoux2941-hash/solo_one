import { Router } from 'express';
import {
  allocateInterviewSlot,
  applications,
  clubs,
  createApplication,
  getApplicationsByStudent,
  getInterviewByApplication,
  getSlotById,
  interviews,
  listApplications,
  slots,
  students,
  updateInterviewResult,
} from '../db.js';
import type { Application, InterviewResult } from '../types.js';

const router = Router();

router.post('/', (req, res) => {
  const {
    studentId,
    name,
    college,
    club1Id,
    club2Id,
    intro,
  } = req.body as {
    studentId?: string;
    name?: string;
    college?: string;
    club1Id?: number;
    club2Id?: number;
    intro?: string;
  };
  if (!studentId || !name || !college || !club1Id || !intro) {
    res.status(400).json({ success: false, error: '请填写完整信息' });
    return;
  }
  const app = createApplication({
    studentId,
    name,
    college,
    club1Id,
    club2Id: club2Id ?? 0,
    intro,
  });
  res.json({ success: true, application: app });
});

router.get('/my', (req, res) => {
  const studentId = req.query.studentId as string | undefined;
  if (!studentId) {
    res.status(400).json({ success: false, error: '缺少学号' });
    return;
  }
  const list = getApplicationsByStudent(studentId).map((a) => enrich(a));
  res.json({ success: true, applications: list });
});

router.get('/', (req, res) => {
  const clubId = req.query.clubId
    ? Number(req.query.clubId)
    : undefined;
  const college = req.query.college as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const list = listApplications({ clubId, college, keyword }).map((a) =>
    enrich(a),
  );
  res.json({ success: true, applications: list });
});

router.post('/:id/review', (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: 'approved' | 'rejected' };
  const app = applications.find((a) => a.id === id);
  if (!app) {
    res.status(404).json({ success: false, error: '报名不存在' });
    return;
  }
  if (status === 'rejected') {
    app.status = 'rejected';
    res.json({ success: true, application: enrich(app) });
    return;
  }
  if (status === 'approved') {
    app.status = 'interview';
    const iv = allocateInterviewSlot(app.id, app.club1Id);
    if (!iv) {
      res.status(400).json({
        success: false,
        error: '该社团暂无可用面试时段，请先添加时段',
      });
      app.status = 'submitted';
      return;
    }
    res.json({
      success: true,
      application: enrich(app),
      interview: iv,
    });
    return;
  }
  res.status(400).json({ success: false, error: '未知操作' });
});

router.post('/:id/result', (req, res) => {
  const id = Number(req.params.id);
  const { result } = req.body as { result?: InterviewResult };
  const iv = interviews.find((x) => x.id === id);
  if (!iv) {
    res.status(404).json({ success: false, error: '面试记录不存在' });
    return;
  }
  if (!result || !['pass', 'pending', 'fail'].includes(result)) {
    res.status(400).json({ success: false, error: '结果无效' });
    return;
  }
  updateInterviewResult(id, result);
  const app = applications.find((a) => a.id === iv.applicationId);
  if (app) {
    app.status =
      result === 'pass' ? 'admitted' : result === 'fail' ? 'failed' : 'pending';
  }
  res.json({ success: true, interview: iv });
});

function enrich(a: Application) {
  const club1 = clubs.find((c) => c.id === a.club1Id);
  const club2 = clubs.find((c) => c.id === a.club2Id);
  const interview = getInterviewByApplication(a.id);
  const slot = interview ? getSlotById(interview.slotId) : null;
  const student = students.find((s) => s.studentId === a.studentId);
  return {
    ...a,
    club1,
    club2,
    slot,
    interview,
    student,
  };
}

export default router;
