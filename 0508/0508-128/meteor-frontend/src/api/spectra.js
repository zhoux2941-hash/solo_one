import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
})

export const spectraApi = {
  upload: (formData) => api.post('/spectra/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  calibrate: (id, data) => api.post(`/spectra/${id}/calibrate`, data),
  
  update: (id, data) => api.put(`/spectra/${id}`, data),
  
  addEmissionLine: (id, data) => api.post(`/spectra/${id}/emission-lines`, data),
  
  deleteEmissionLine: (lineId) => api.delete(`/spectra/emission-lines/${lineId}`),
  
  getDetail: (id) => api.get(`/spectra/${id}`),
  
  getAll: (page = 0, size = 20) => api.get('/spectra', {
    params: { page, size }
  }),
  
  search: (data) => api.post('/spectra/search', data),
  
  delete: (id) => api.delete(`/spectra/${id}`)
}

export const velocityApi = {
  estimate: (data) => api.post('/velocity/estimate', data),
  getPresets: () => api.get('/velocity/presets')
}

export default api
