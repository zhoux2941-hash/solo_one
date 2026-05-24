import { Router, Request, Response } from 'express';
import { checkConflicts } from '../services/conflictService.js';

const router = Router();

router.post('/check', (req: Request, res: Response) => {
  const { startTime, endTime, roomId, escorts, excludeId } = req.body;
  
  if (!startTime || !endTime || !roomId || !escorts) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const result = checkConflicts(startTime, endTime, roomId, escorts, excludeId);
  res.json(result);
});

export default router;
