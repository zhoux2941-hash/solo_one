import axios from 'axios'
import type { 
  Stock, 
  KLineData, 
  TimeLineData, 
  WatchlistGroup, 
  PriceAlert, 
  User,
  ScreenStrategy,
  ScreenResult,
  ScreenMeta,
  FilterCondition
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username: string, password: string) => 
    api.post<{ token: string; user: User }>('/auth/login', { username, password }),
  
  register: (username: string, password: string, email?: string) => 
    api.post<{ token: string; user: User }>('/auth/register', { username, password, email }),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get<User>('/auth/me')
}

export const stockAPI = {
  search: (keyword: string) => 
    api.get<Stock[]>(`/stocks/search?keyword=${encodeURIComponent(keyword)}`),
  
  getRealTime: (code: string) => 
    api.get<Stock>(`/stocks/${code}/realtime`),
  
  getKLine: (code: string, type: 'day' | 'week' | 'month' = 'day', startDate?: string, endDate?: string) => {
    let url = `/stocks/${code}/kline?type=${type}`
    if (startDate) url += `&startDate=${startDate}`
    if (endDate) url += `&endDate=${endDate}`
    return api.get<KLineData[]>(url)
  },
  
  getTimeLine: (code: string) => 
    api.get<TimeLineData[]>(`/stocks/${code}/timeline`),
  
  getMarketList: (market: 'sh' | 'sz' | 'hk' | 'us') => 
    api.get<Stock[]>(`/stocks/market/${market}`)
}

export const watchlistAPI = {
  getGroups: () => api.get<WatchlistGroup[]>('/watchlist/groups'),
  
  createGroup: (name: string) => 
    api.post<WatchlistGroup>('/watchlist/groups', { name }),
  
  deleteGroup: (groupId: number) => 
    api.delete(`/watchlist/groups/${groupId}`),
  
  addStock: (groupId: number, stockCode: string) => 
    api.post(`/watchlist/groups/${groupId}/stocks`, { stockCode }),
  
  removeStock: (groupId: number, stockCode: string) => 
    api.delete(`/watchlist/groups/${groupId}/stocks/${stockCode}`)
}

export const alertAPI = {
  getAlerts: () => api.get<PriceAlert[]>('/alerts'),
  
  createAlert: (data: { stockCode: string; targetPrice: number; type: 'above' | 'below' }) => 
    api.post<PriceAlert>('/alerts', data),
  
  deleteAlert: (alertId: number) => 
    api.delete(`/alerts/${alertId}`),
  
  updateAlert: (alertId: number, data: Partial<PriceAlert>) => 
    api.put<PriceAlert>(`/alerts/${alertId}`, data)
}

export const screenerAPI = {
  getMeta: () => api.get<ScreenMeta>('/screener/meta'),
  
  executeScreen: (conditions: FilterCondition[], markets?: string[], limit?: number) => 
    api.post<ScreenResult[]>('/screener/execute', { 
      conditions, 
      markets, 
      limit 
    }),
  
  getStrategies: () => api.get<ScreenStrategy[]>('/screener/strategies'),
  
  createStrategy: (data: { 
    name: string; 
    description?: string; 
    conditions: FilterCondition[];
    isDefault?: boolean;
  }) => 
    api.post<ScreenStrategy>('/screener/strategies', data),
  
  updateStrategy: (strategyId: number, data: Partial<ScreenStrategy>) => 
    api.put<ScreenStrategy>(`/screener/strategies/${strategyId}`, data),
  
  deleteStrategy: (strategyId: number) => 
    api.delete(`/screener/strategies/${strategyId}`),
  
  executeStrategy: (strategyId: number, markets?: string[], limit?: number) => {
    let url = `/screener/strategies/${strategyId}/execute`
    const params: string[] = []
    if (markets && markets.length > 0) {
      params.push(`markets=${markets.join(',')}`)
    }
    if (limit) {
      params.push(`limit=${limit}`)
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }
    return api.post<ScreenResult[]>(url)
  }
}

export default api
