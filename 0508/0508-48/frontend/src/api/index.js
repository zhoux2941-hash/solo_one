import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const equipmentApi = {
  getAll: () => api.get('/equipment'),
  getById: (id) => api.get(`/equipment/${id}`),
  getByCategory: (category) => api.get(`/equipment/category/${category}`)
}

export const sanitizationApi = {
  record: (data) => api.post('/sanitization/record', data),
  getTodayStatus: () => api.get('/sanitization/today-status'),
  getHeatmap: () => api.get('/sanitization/heatmap'),
  getRecordsByEquipment: (equipmentId) => api.get(`/sanitization/equipment/${equipmentId}`),
  batchRecord: (data) => api.post('/sanitization/batch-record', data),
  getComplianceStats: (period = 'LAST_7_DAYS') => api.get(`/sanitization/compliance-stats?period=${period}`)
}

export default api
