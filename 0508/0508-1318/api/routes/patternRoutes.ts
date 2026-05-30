import { Router, type Request, type Response } from 'express';
import { getAllPatterns, getPatternById } from '../services/patternService.js';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  try {
    const patterns = getAllPatterns();
    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取纹饰数据失败' });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: '无效的纹饰ID' });
      return;
    }

    const pattern = getPatternById(id);
    if (!pattern) {
      res.status(404).json({ success: false, error: '未找到该纹饰' });
      return;
    }

    res.json({ success: true, data: pattern });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取纹饰详情失败' });
  }
});

export default router;
