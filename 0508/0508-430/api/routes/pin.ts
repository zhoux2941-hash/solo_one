import { Router, Request, Response } from 'express';
import PinService from '../services/PinService.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const pins = PinService.getAllPins();
  res.json(pins);
});

router.post('/', (req: Request, res: Response) => {
  const { keyword, articleId, articleTitle } = req.body;
  const operator = req.adminUser?.username || 'admin';
  
  if (!keyword || !articleId || !articleTitle) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  
  const id = PinService.setPin(keyword, articleId, articleTitle, operator);
  res.json({ success: true, id });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const operator = req.adminUser?.username || 'admin';
  
  const success = PinService.removePin(id, operator);
  res.json({ success });
});

export default router;
