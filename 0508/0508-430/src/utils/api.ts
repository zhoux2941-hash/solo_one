import {
  Article,
  SearchResult,
  OverviewStats,
  LowSatisfactionKeyword,
  SatisfactionTrendItem,
  ArticleRankingItem,
  PinConfig,
  ABTest,
  ABTestReport,
  OperationLog
} from '../../shared/index.js';

const DEPARTMENTS = ['技术部', '产品部', '市场部', '人力资源部', '财务部', '运营部', '销售部'];
const randomDepartment = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Department': randomDepartment
  };
  
  const token = localStorage.getItem('admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
    }
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json() as Promise<T>;
}

export const searchApi = {
  search: (query: string, page: number = 1, pageSize: number = 10): Promise<SearchResult> => {
    const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
    return fetch(`/api/search?${params}`, { headers: getHeaders() })
      .then(handleResponse<SearchResult>);
  },
  
  submitFeedback: (data: {
    query: string;
    articleId: string;
    articleTitle: string;
    feedbackType: 'useful' | 'useless';
  }): Promise<{ success: boolean; message: string }> => {
    return fetch('/api/feedback', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse<{ success: boolean; message: string }>);
  },
  
  getArticles: (): Promise<Article[]> => {
    return fetch('/api/articles', { headers: getHeaders() })
      .then(handleResponse<Article[]>);
  }
};

export const adminApi = {
  login: (username: string, password: string): Promise<{ success: boolean; token: string }> => {
    return fetch('/api/admin/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password })
    }).then(handleResponse<{ success: boolean; token: string }>);
  },
  
  getOverview: (): Promise<OverviewStats> => {
    return fetch('/api/admin/stats/overview', { headers: getHeaders() })
      .then(handleResponse<OverviewStats>);
  },
  
  getLowSatisfactionKeywords: (minSearchCount?: number, maxUsefulRate?: number): Promise<LowSatisfactionKeyword[]> => {
    const params = new URLSearchParams();
    if (minSearchCount !== undefined) params.append('minSearchCount', String(minSearchCount));
    if (maxUsefulRate !== undefined) params.append('maxUsefulRate', String(maxUsefulRate));
    return fetch(`/api/admin/stats/low-satisfaction-keywords?${params}`, { headers: getHeaders() })
      .then(handleResponse<LowSatisfactionKeyword[]>);
  },
  
  getSatisfactionTrend: (granularity?: 'day' | 'hour', days?: number): Promise<SatisfactionTrendItem[]> => {
    const params = new URLSearchParams();
    if (granularity) params.append('granularity', granularity);
    if (days !== undefined) params.append('days', String(days));
    return fetch(`/api/admin/stats/satisfaction-trend?${params}`, { headers: getHeaders() })
      .then(handleResponse<SatisfactionTrendItem[]>);
  },
  
  getArticleRanking: (limit?: number, order?: 'asc' | 'desc'): Promise<ArticleRankingItem[]> => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', String(limit));
    if (order) params.append('order', order);
    return fetch(`/api/admin/stats/article-ranking?${params}`, { headers: getHeaders() })
      .then(handleResponse<ArticleRankingItem[]>);
  }
};

export const pinApi = {
  getAll: (): Promise<PinConfig[]> => {
    return fetch('/api/admin/pin', { headers: getHeaders() })
      .then(handleResponse<PinConfig[]>);
  },
  
  setPin: (keyword: string, articleId: string, articleTitle: string): Promise<{ success: boolean; id: string }> => {
    return fetch('/api/admin/pin', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ keyword, articleId, articleTitle })
    }).then(handleResponse<{ success: boolean; id: string }>);
  },
  
  removePin: (id: string): Promise<{ success: boolean }> => {
    return fetch(`/api/admin/pin/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    }).then(handleResponse<{ success: boolean }>);
  }
};

export const abtestApi = {
  getAll: (): Promise<ABTest[]> => {
    return fetch('/api/admin/abtest', { headers: getHeaders() })
      .then(handleResponse<ABTest[]>);
  },
  
  getRunning: (): Promise<ABTest | null> => {
    return fetch('/api/admin/abtest/running', { headers: getHeaders() })
      .then(handleResponse<ABTest | null>);
  },
  
  create: (name: string, algorithmA: string, algorithmB: string): Promise<{ success: boolean; id: string }> => {
    return fetch('/api/admin/abtest', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, algorithmA, algorithmB })
    }).then(handleResponse<{ success: boolean; id: string }>);
  },
  
  getById: (id: string): Promise<ABTest> => {
    return fetch(`/api/admin/abtest/${id}`, { headers: getHeaders() })
      .then(handleResponse<ABTest>);
  },
  
  getReport: (id: string): Promise<ABTestReport> => {
    return fetch(`/api/admin/abtest/${id}/report`, { headers: getHeaders() })
      .then(handleResponse<ABTestReport>);
  },
  
  updateStatus: (id: string, status: 'running' | 'completed'): Promise<{ success: boolean }> => {
    return fetch(`/api/admin/abtest/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    }).then(handleResponse<{ success: boolean }>);
  }
};

export const logsApi = {
  getAll: (limit?: number, offset?: number, type?: string): Promise<OperationLog[]> => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', String(limit));
    if (offset !== undefined) params.append('offset', String(offset));
    if (type) params.append('type', type);
    return fetch(`/api/admin/logs?${params}`, { headers: getHeaders() })
      .then(handleResponse<OperationLog[]>);
  }
};
