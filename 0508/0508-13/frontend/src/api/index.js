import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const packageApi = {
  getAll: () => api.get('/packages'),
  getById: id => api.get(`/packages/${id}`),
  getByNo: no => api.get(`/packages/no/${no}`),
  create: data => api.post('/packages', data)
}

export const trackApi = {
  getByPackageId: packageId => api.get(`/tracks/package/${packageId}`),
  getPaginated: (packageId, page = 0, size = 10) =>
    api.get(`/tracks/package/${packageId}/page`, { params: { page, size } }),
  add: (packageId, track) => api.post(`/tracks/package/${packageId}`, track)
}

export const statisticsApi = {
  getDailyTime: (days = 7) => api.get('/statistics/daily-time', { params: { days } }),
  getRouteTime: () => api.get('/statistics/route-time'),
  getStuckCenters: () => api.get('/statistics/stuck-centers'),
  refreshStuckCenters: () => api.get('/statistics/stuck-centers/refresh'),
  getSankeyData: () => api.get('/statistics/sankey')
}

export const batchApi = {
  getBatchTrackSummary: (packageIds) => api.post('/batch/tracks/summary', packageIds),
  getAllTrackSummaries: () => api.get('/batch/tracks/all-summary'),
  getRouteAggregation: () => api.get('/batch/routes/aggregation'),
  refreshRouteAggregation: () => api.get('/batch/routes/aggregation/refresh')
}

export const anomalyApi = {
  getAnomalyList: () => api.get('/anomaly/list'),
  getRouteStatistics: () => api.get('/anomaly/route-stats'),
  detectAnomalies: () => api.get('/anomaly/detect'),
  forceDetect: () => api.post('/anomaly/force-detect'),
  getAnomalyCount: () => api.get('/anomaly/count')
}

export default api
