export interface Reader {
  id: number
  name: string
  phone?: string
  email?: string
  createTime?: string
  updateTime?: string
}

export interface Book {
  id: number
  title: string
  author?: string
  isbn?: string
  category?: string
  tags?: string
  pages?: number
  publishDate?: string
  description?: string
  createTime?: string
  updateTime?: string
}

export interface BorrowRecord {
  id: number
  readerId: number
  bookId: number
  borrowTime: string
  dueTime?: string
  returnTime?: string
  category?: string
  tags?: string
  pages?: number
  createTime?: string
  updateTime?: string
}

export interface TagInterest {
  tag: string
  storedWeight: number
  weight?: number
  lastDecayTime?: string
  lastBorrowTime: string
  borrowCount: number
}

export interface RiverChartResult {
  months: string[]
  tags: string[]
  series: Array<{
    name: string
    data: number[]
  }>
}

export interface BreadthData {
  month: string
  categoryCount: number
}

export interface TrendingTag {
  tag: string
  currentMonthCount: number
  previousMonthCount: number
  growthRate: number
}

export interface RecommendedBook {
  book: Book
  score: number
  matchReasons: string[]
}

export interface CompletionRateData {
  month: string
  completionRate: number
  totalBorrows: number
  completedCount: number
  abandonedCount: number
}

export interface AbandonedCategory {
  category: string
  totalBorrows: number
  abandonedCount: number
  abandonRate: number
}

export interface CompletionStats {
  overallCompletionRate: number
  totalBorrows: number
  completedCount: number
  abandonedCount: number
  averageCompletionRate: number
  bestCategories: string[]
  worstCategories: string[]
}

export interface ApiResult<T> {
  code: number
  message: string
  data: T
}
