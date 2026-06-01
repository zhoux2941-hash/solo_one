import { Router, Request, Response } from 'express';
import StatsService from '../services/StatsService.js';

const router = Router();

router.get('/overview', (_req: Request, res: Response) => {
  const stats = StatsService.getOverview();
  res.json(stats);
});

router.get('/low-satisfaction-keywords', (req: Request, res: Response) => {
  const { minSearchCount, maxUsefulRate } = req.query;
  const keywords = StatsService.getLowSatisfactionKeywords(
    parseInt(minSearchCount as string) || 10,
    parseFloat(maxUsefulRate as string) || 0.3
  );
  res.json(keywords);
});

router.get('/satisfaction-trend', (req: Request, res: Response) => {
  const { granularity, days } = req.query;
  const trend = StatsService.getSatisfactionTrend(
    (granularity as 'day' | 'hour') || 'day',
    parseInt(days as string) || 7
  );
  res.json(trend);
});

router.get('/article-ranking', (req: Request, res: Response) => {
  const { limit, order } = req.query;
  const ranking = StatsService.getArticleRanking(
    parseInt(limit as string) || 10,
    (order as 'asc' | 'desc') || 'desc'
  );
  res.json(ranking);
});

export default router;
