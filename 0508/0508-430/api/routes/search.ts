import { Router, Request, Response } from 'express';
import SearchService from '../services/SearchService.js';
import FeedbackService from '../services/FeedbackService.js';

const router = Router();

router.get('/search', (req: Request, res: Response) => {
  const { q, page, pageSize } = req.query;
  const department = req.headers['x-user-department'] as string;
  
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: '搜索关键词不能为空' });
    return;
  }
  
  const result = SearchService.search(
    q,
    department,
    parseInt(page as string) || 1,
    parseInt(pageSize as string) || 10
  );
  
  res.json(result);
});

router.post('/feedback', (req: Request, res: Response) => {
  const { query, articleId, articleTitle, feedbackType } = req.body;
  const department = req.headers['x-user-department'] as string;
  
  if (!query || !articleId || !articleTitle || !feedbackType) {
    res.status(400).json({ error: '参数不完整' });
    return;
  }
  
  if (feedbackType !== 'useful' && feedbackType !== 'useless') {
    res.status(400).json({ error: '反馈类型无效' });
    return;
  }
  
  FeedbackService.submitFeedback(query, articleId, articleTitle, feedbackType, department);
  
  res.json({
    success: true,
    message: '反馈已记录，感谢您的评价！'
  });
});

router.get('/articles', (_req: Request, res: Response) => {
  const articles = SearchService.getAllArticles();
  res.json(articles);
});

export default router;
