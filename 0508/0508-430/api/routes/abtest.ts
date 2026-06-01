import { Router, Request, Response } from 'express';
import ABTestService from '../services/ABTestService.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const tests = ABTestService.getAllTests();
  res.json(tests);
});

router.get('/running', (_req: Request, res: Response) => {
  const test = ABTestService.getRunningTest();
  res.json(test);
});

router.post('/', (req: Request, res: Response) => {
  const { name, algorithmA, algorithmB } = req.body;
  const createdBy = req.adminUser?.username || 'admin';
  
  if (!name || !algorithmA || !algorithmB) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  
  const id = ABTestService.createTest(name, algorithmA, algorithmB, createdBy);
  res.json({ success: true, id });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const test = ABTestService.getTestById(id);
  if (!test) {
    res.status(404).json({ error: '测试不存在' });
    return;
  }
  res.json(test);
});

router.get('/:id/report', (req: Request, res: Response) => {
  const { id } = req.params;
  const report = ABTestService.getTestReport(id);
  if (!report) {
    res.status(404).json({ error: '测试不存在' });
    return;
  }
  res.json(report);
});

router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const operator = req.adminUser?.username || 'admin';
  
  let success = false;
  if (status === 'running') {
    success = ABTestService.startTest(id, operator);
  } else if (status === 'completed') {
    success = ABTestService.stopTest(id, operator);
  } else {
    res.status(400).json({ error: '无效的状态值' });
    return;
  }
  
  res.json({ success });
});

export default router;
