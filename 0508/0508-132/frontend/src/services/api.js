import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const tubeRackApi = {
  create: (data) => api.post('/tube-racks', data),
  getAll: () => api.get('/tube-racks'),
  getById: (id) => api.get(`/tube-racks/${id}`),
  updateWell: (tubeRackId, row, col, data) => 
    api.put(`/tube-racks/${tubeRackId}/wells/${row}/${col}`, data),
  updateWellsBatch: (tubeRackId, data) => 
    api.put(`/tube-racks/${tubeRackId}/wells/batch`, data),
  delete: (id) => api.delete(`/tube-racks/${id}`)
}

export const experimentApi = {
  create: (data) => api.post('/experiments', data),
  getAll: () => api.get('/experiments'),
  getShared: () => api.get('/experiments/shared'),
  getByShareCode: (code) => api.get(`/experiments/share/${code}`),
  getById: (id) => api.get(`/experiments/${id}`),
  update: (id, data) => api.put(`/experiments/${id}`, data),
  share: (id) => api.post(`/experiments/${id}/share`),
  delete: (id) => api.delete(`/experiments/${id}`)
}

export const optimizationApi = {
  optimize: (data) => api.post('/optimization/optimize', data),
  calculateManual: (tasks, startRow, startCol) => 
    api.post('/optimization/calculate-manual', tasks, {
      params: { startRow, startCol }
    })
}

export default api