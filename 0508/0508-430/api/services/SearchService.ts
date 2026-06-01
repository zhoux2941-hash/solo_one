import { MOCK_ARTICLES } from '../data/mockArticles.js';
import { Article, SearchResult } from '../../shared/index.js';
import ArticleClickStatsRepository from '../repositories/ArticleClickStatsRepository.js';
import PinConfigRepository from '../repositories/PinConfigRepository.js';
import ABTestRepository from '../repositories/ABTestRepository.js';
import SearchLogRepository from '../repositories/SearchLogRepository.js';

function calculateRelevance(article: Article, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = article.title.toLowerCase();
  const lowerSnippet = article.contentSnippet.toLowerCase();
  
  const titleMatch = lowerTitle.includes(lowerQuery) ? 10 : 0;
  const snippetMatch = lowerSnippet.includes(lowerQuery) ? 5 : 0;
  const queryWords = lowerQuery.split(/\s+/);
  const wordMatches = queryWords.filter(word => 
    lowerTitle.includes(word) || lowerSnippet.includes(word)
  ).length;
  
  return titleMatch + snippetMatch + wordMatches * 2;
}

function algorithmDefault(articles: Article[], query: string): Article[] {
  return [...articles].sort((a, b) => {
    const scoreA = calculateRelevance(a, query);
    const scoreB = calculateRelevance(b, query);
    return scoreB - scoreA;
  });
}

function algorithmClickWeighted(articles: Article[], query: string): Article[] {
  const clickStats = ArticleClickStatsRepository.getClickStats(query);
  
  return [...articles].sort((a, b) => {
    const relevanceA = calculateRelevance(a, query);
    const relevanceB = calculateRelevance(b, query);
    const clicksA = clickStats.get(`${a.id}:${query}`) || 0;
    const clicksB = clickStats.get(`${b.id}:${query}`) || 0;
    const scoreA = relevanceA * 0.6 + Math.log10(clicksA + 1) * 10 * 0.4;
    const scoreB = relevanceB * 0.6 + Math.log10(clicksB + 1) * 10 * 0.4;
    return scoreB - scoreA;
  });
}

function fuzzyMatch(article: Article, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = article.title.toLowerCase();
  const lowerSnippet = article.contentSnippet.toLowerCase();
  
  if (lowerTitle.includes(lowerQuery) || lowerSnippet.includes(lowerQuery)) {
    return true;
  }
  
  const queryWords = lowerQuery.split(/\s+/);
  return queryWords.some(word => 
    lowerTitle.includes(word) || lowerSnippet.includes(word)
  );
}

function getAlgorithmGroup(department: string): 'A' | 'B' | null {
  const runningTest = ABTestRepository.getRunningTest();
  if (!runningTest) return null;
  
  let assignment = ABTestRepository.getAssignment(runningTest.id, department);
  
  if (!assignment) {
    assignment = Math.random() < 0.5 ? 'A' : 'B';
    ABTestRepository.assignDepartment(runningTest.id, department, assignment);
  }
  
  return assignment;
}

class SearchService {
  search(query: string, userDepartment: string, page: number = 1, pageSize: number = 10): SearchResult {
    const algorithmGroup = getAlgorithmGroup(userDepartment);
    
    const matchedArticles = MOCK_ARTICLES.filter(article => fuzzyMatch(article, query));
    
    let sortedArticles: Article[];
    if (algorithmGroup === 'B') {
      sortedArticles = algorithmClickWeighted(matchedArticles, query);
    } else {
      sortedArticles = algorithmDefault(matchedArticles, query);
    }
    
    const pinConfig = PinConfigRepository.getActivePin(query);
    let pinnedArticle: Article | undefined;
    
    if (pinConfig) {
      const pinned = matchedArticles.find(a => a.id === pinConfig.articleId);
      if (pinned) {
        pinnedArticle = pinned;
        sortedArticles = sortedArticles.filter(a => a.id !== pinConfig.articleId);
        sortedArticles.unshift(pinned);
      }
    }
    
    const total = sortedArticles.length;
    const startIndex = (page - 1) * pageSize;
    const pagedArticles = sortedArticles.slice(startIndex, startIndex + pageSize);
    
    SearchLogRepository.create(query, userDepartment, algorithmGroup || undefined, total);
    
    return {
      articles: pagedArticles,
      total,
      query,
      pinnedArticle,
      algorithm: algorithmGroup || 'A'
    };
  }

  getAllArticles(): Article[] {
    return MOCK_ARTICLES;
  }

  getArticleById(id: string): Article | undefined {
    return MOCK_ARTICLES.find(a => a.id === id);
  }
}

export default new SearchService();
