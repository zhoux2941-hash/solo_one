import { Router, Request, Response } from 'express';
import OperationLogService from '../services/OperationLogService.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { limit, offset, type } = req.query;
  
  if (type) {
    const logs = OperationLogService.getLogsByType(
      type as any,
      parseInt(limit as string) || 50
    );
    res.json(logs);
  } else {
    const logs = OperationLogService.getLogs(
      parseInt(limit as string) || 100,
      parseInt(offset as string) || 0
    );
    res.json(logs);
  }
});

export default router;
