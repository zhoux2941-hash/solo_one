import axios from 'axios'
import type {
  Reader,
  Book,
  BorrowRecord,
  TagInterest,
  RiverChartResult,
  BreadthData,
  TrendingTag,
  RecommendedBook,
  CompletionRateData,
  AbandonedCategory,
  CompletionStats,
  ApiResult,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const readerApi = {
  list: () => api.get<ApiResult<Reader[]>>('/readers'),
  getById: (id: number) => api.get<ApiResult<Reader>>(`/readers/${id}`),
}

export const bookApi = {
  list: () => api.get<ApiResult<Book[]>>('/books'),
  getById: (id: number) => api.get<ApiResult<Book>>(`/books/${id}`),
  findByTag: (tag: string) => api.get<ApiResult<Book[]>>(`/books/tag/${tag}`),
  findByCategory: (category: string) => api.get<ApiResult<Book[]>>(`/books/category/${category}`),
  categories: () => api.get<ApiResult<string[]>>('/books/categories'),
  tags: () => api.get<ApiResult<string[]>>('/books/tags'),
}

export const borrowApi = {
  borrow: (readerId: number, bookId: number) =>
    api.post<ApiResult<BorrowRecord>>(`/borrow/${readerId}/${bookId}`),
  returnBook: (recordId: number) =>
    api.post<ApiResult<void>>(`/borrow/return/${recordId}`),
  getByReader: (readerId: number) =>
    api.get<ApiResult<BorrowRecord[]>>(`/borrow/reader/${readerId}`),
}

export const analysisApi = {
  getInterestEvolution: (readerId: number, months: number = 6) =>
    api.get<ApiResult<RiverChartResult>>(`/analysis/interest-evolution/${readerId}`, {
      params: { months },
    }),
  getReadingBreadth: (readerId: number, months: number = 6) =>
    api.get<ApiResult<BreadthData[]>>(`/analysis/reading-breadth/${readerId}`, {
      params: { months },
    }),
  getTrendingTags: (limit: number = 10) =>
    api.get<ApiResult<TrendingTag[]>>('/analysis/trending-tags', {
      params: { limit },
    }),
  getInterestVector: (readerId: number) =>
    api.get<ApiResult<TagInterest[]>>(`/analysis/interest-vector/${readerId}`),
}

export const recommendationApi = {
  getRecommendations: (readerId: number, limit: number = 10) =>
    api.get<ApiResult<RecommendedBook[]>>(`/recommendation/${readerId}`, {
      params: { limit },
    }),
  getDetails: (readerId: number) =>
    api.get<ApiResult<any>>(`/recommendation/details/${readerId}`),
}

export const completionApi = {
  getMonthlyCompletionRate: (readerId: number, months: number = 6) =>
    api.get<ApiResult<CompletionRateData[]>>(`/completion/rate-trend/${readerId}`, {
      params: { months },
    }),
  getAbandonedCategories: (readerId: number) =>
    api.get<ApiResult<AbandonedCategory[]>>(`/completion/abandoned-categories/${readerId}`),
  getCompletionStats: (readerId: number) =>
    api.get<ApiResult<CompletionStats>>(`/completion/stats/${readerId}`),
  getRecentCompletionDetails: (readerId: number, limit: number = 10) =>
    api.get<ApiResult<any[]>>(`/completion/details/${readerId}`, {
      params: { limit },
    }),
}

export default api
