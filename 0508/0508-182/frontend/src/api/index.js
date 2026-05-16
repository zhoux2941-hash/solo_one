import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const bedApi = {
  getAll: () => api.get('/beds'),
  getById: (id) => api.get(`/beds/${id}`),
  create: (data) => api.post('/beds', data),
  update: (id, data) => api.put(`/beds/${id}`, data),
  assignPatient: (id, data) => api.put(`/beds/${id}/assign`, data),
  release: (id) => api.put(`/beds/${id}/release`),
  delete: (id) => api.delete(`/beds/${id}`),
  getIcuOccupiedCount: () => api.get('/beds/stats/icu-occupied')
}

export const nurseApi = {
  getAll: () => api.get('/nurses'),
  getById: (id) => api.get(`/nurses/${id}`),
  create: (data) => api.post('/nurses', data),
  update: (id, data) => api.put(`/nurses/${id}`, data),
  delete: (id) => api.delete(`/nurses/${id}`),
  getIcuQualified: () => api.get('/nurses/icu-qualified')
}

export const scheduleApi = {
  getByDateRange: (start, end) => api.get('/schedules', { params: { start, end } }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  requestSwap: (data) => api.post('/schedules/swap-request', data),
  approveSwap: (id, data) => api.post(`/schedules/swap-request/${id}/approve`, data),
  getPendingSwaps: () => api.get('/schedules/swap-requests/pending'),
  validateIcuCoverage: (date) => api.get('/schedules/validate/icu-coverage', { params: { date } })
}

export default api
