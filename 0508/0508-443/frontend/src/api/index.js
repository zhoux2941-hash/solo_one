import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const streamsApi = {
  getAll: () => api.get('/streams'),
  getById: (id) => api.get(`/streams/${id}`),
  create: (data) => api.post('/streams', data),
  update: (id, data) => api.put(`/streams/${id}`, data),
  delete: (id) => api.delete(`/streams/${id}`),
  startMonitoring: (id) => api.post(`/streams/${id}/start`),
  stopMonitoring: (id) => api.post(`/streams/${id}/stop`),
  getMetrics: (id) => api.get(`/streams/${id}/metrics`)
}

export const alertsApi = {
  getAll: (filters = {}) => api.get('/alerts', { params: filters }),
  getById: (id) => api.get(`/alerts/${id}`),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  delete: (id) => api.delete(`/alerts/${id}`)
}

export const recordingsApi = {
  getAll: (filters = {}) => api.get('/recordings', { params: filters }),
  getStatus: () => api.get('/recordings/status'),
  getById: (id) => api.get(`/recordings/${id}`),
  start: (streamId, segmentDuration) => api.post(`/recordings/${streamId}/start`, { segmentDuration }),
  stop: (streamId) => api.post(`/recordings/${streamId}/stop`),
  delete: (id) => api.delete(`/recordings/${id}`)
}

export const analyzeApi = {
  uploadTsFile: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/analyze/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })
  }
}

export default api
