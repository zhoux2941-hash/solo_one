import SearchLogRepository from '../repositories/SearchLogRepository.js';
import FeedbackRepository from '../repositories/FeedbackRepository.js';
import ABTestRepository from '../repositories/ABTestRepository.js';
import { OverviewStats, LowSatisfactionKeyword, SatisfactionTrendItem, ArticleRankingItem } from '../../shared/index.js';

class StatsService {
  getOverview(): OverviewStats {
    return {
      todaySearches: SearchLogRepository.getTodaySearchCount(),
      totalFeedbacks: FeedbackRepository.getTotalCount(),
      avgUsefulRate: FeedbackRepository.getAvgUsefulRate(),
      runningABTests: ABTestRepository.getRunningTestCount()
    };
  }

  getLowSatisfactionKeywords(minSearchCount: number = 5, maxUsefulRate: number = 0.3): LowSatisfactionKeyword[] {
    return FeedbackRepository.getLowSatisfactionKeywords(minSearchCount, maxUsefulRate);
  }

  getSatisfactionTrend(granularity: 'day' | 'hour' = 'day', days: number = 7): SatisfactionTrendItem[] {
    return FeedbackRepository.getSatisfactionTrend(granularity, days);
  }

  getArticleRanking(limit: number = 10, order: 'asc' | 'desc' = 'desc'): ArticleRankingItem[] {
    return FeedbackRepository.getArticleRanking(limit, order);
  }
}

export default new StatsService();
