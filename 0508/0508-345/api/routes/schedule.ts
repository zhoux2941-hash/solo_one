import { Router, Request, Response } from 'express';
import { getScheduleView, getConflictAnalysis } from '../services/conflictAnalysisService.js';
import { getRecentConflictRecords, resolveConflictRecord } from '../data/conflictRecords.js';

const router = Router();

router.get('/view', (req: Request, res: Response) => {
  const { type = 'room', date } = req.query;
  const viewType = type === 'escort' ? 'escort' : 'room';
  const data = getScheduleView(viewType, date as string);
  res.json(data);
});

router.get('/conflicts/recent', (req: Request, res: Response) => {
  const { days = '3' } = req.query;
  const records = getRecentConflictRecords(parseInt(days as string));
  res.json(records);
});

router.get('/conflicts/analysis', (req: Request, res: Response) => {
  const { days = '3' } = req.query;
  const analysis = getConflictAnalysis(parseInt(days as string));
  res.json(analysis);
});

router.post('/conflicts/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolution } = req.body;
  const updated = resolveConflictRecord(id, resolution);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: '冲突记录不存在' });
  }
});

export default router;
