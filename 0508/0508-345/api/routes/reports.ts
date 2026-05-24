import { Router, Request, Response } from 'express';
import { getDailyReport } from '../services/reportService.js';

const router = Router();

router.get('/daily', (req: Request, res: Response) => {
  const { date } = req.query;
  const report = getDailyReport(date as string);
  res.json(report);
});

export default router;
