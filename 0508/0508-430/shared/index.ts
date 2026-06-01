export interface Article {
  id: string;
  title: string;
  contentSnippet: string;
  publishTime: string;
  url?: string;
}

export interface SearchResult {
  articles: Article[];
  total: number;
  query: string;
  pinnedArticle?: Article;
  algorithm?: 'A' | 'B';
}

export interface Feedback {
  id: string;
  query: string;
  articleId: string;
  articleTitle: string;
  feedbackType: 'useful' | 'useless';
  timestamp: string;
  userDepartment: string;
  algorithmGroup?: 'A' | 'B';
}

export interface PinConfig {
  id: string;
  keyword: string;
  articleId: string;
  articleTitle: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  algorithmA: string;
  algorithmB: string;
  startTime: string;
  endTime?: string;
  status: 'draft' | 'running' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface ABTestReport {
  testId: string;
  groupAStats: {
    totalSearches: number;
    totalFeedbacks: number;
    usefulRate: number;
    clickThroughRate: number;
  };
  groupBStats: {
    totalSearches: number;
    totalFeedbacks: number;
    usefulRate: number;
    clickThroughRate: number;
  };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
}

export interface OperationLog {
  id: string;
  operator: string;
  operationType: 'pin_set' | 'pin_remove' | 'abtest_create' | 'abtest_start' | 'abtest_stop';
  targetKeyword?: string;
  targetArticleId?: string;
  targetArticleTitle?: string;
  details: string;
  timestamp: string;
}

export interface OverviewStats {
  todaySearches: number;
  totalFeedbacks: number;
  avgUsefulRate: number;
  runningABTests: number;
}

export interface LowSatisfactionKeyword {
  query: string;
  searchCount: number;
  feedbackCount: number;
  usefulRate: number;
}

export interface SatisfactionTrendItem {
  time: string;
  searchCount: number;
  usefulCount: number;
  uselessCount: number;
  usefulRate: number;
}

export interface ArticleRankingItem {
  articleId: string;
  articleTitle: string;
  feedbackCount: number;
  usefulCount: number;
  uselessCount: number;
  usefulRate: number;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}
