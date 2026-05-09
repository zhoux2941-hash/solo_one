import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const searchApi = {
  search: (keyword, userId) => api.post('/search', { keyword, userId }),
  recordClick: (searchId, docId, keyword) => {
    const params = keyword ? { params: { keyword } } : {}
    return api.post('/search/click', { searchId, docId }, params)
  },
  getHotSearches: (limit = 10) => api.get(`/search/hot?limit=${limit}`),
  getSuggestions: (prefix, limit = 10) => api.get(`/search/suggestions?prefix=${encodeURIComponent(prefix)}&limit=${limit}`),
  getRelated: (keyword, limit = 10) => api.get(`/search/related?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
}

export const analyticsApi = {
  getVolumeTrend: (hours = 24) => api.get(`/analytics/volume-trend?hours=${hours}`),
  getNoResultRate: (days = 7) => api.get(`/analytics/noresult-rate?days=${days}`),
  getClickHeatmap: () => api.get('/analytics/click-heatmap'),
  getWordCloud: (limit = 50) => api.get(`/analytics/wordcloud?limit=${limit}`),
  getDocRanking: (limit = 10) => api.get(`/analytics/doc-ranking?limit=${limit}`),
  getSummary: () => api.get('/analytics/summary')
}

export const documentApi = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  create: (doc) => api.post('/documents', doc),
  update: (id, doc) => api.put(`/documents/${id}`, doc),
  delete: (id) => api.delete(`/documents/${id}`)
}

export default api
