import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const showerAPI = {
  getAll: () => api.get('/showers'),
  getHot: () => api.get('/showers/hot'),
  getConstellations: () => api.get('/showers/constellations'),
  getInfo: () => api.get('/showers/info')
}

export const sessionAPI = {
  create: (data) => api.post('/sessions', data),
  get: (id) => api.get(`/sessions/${id}`),
  getDetail: (id) => api.get(`/sessions/${id}/detail`),
  end: (id) => api.post(`/sessions/${id}/end`),
  getByShower: (showerName) => api.get(`/sessions/shower/${showerName}`),
  getActive: () => api.get('/sessions/active'),
  getConsensus: (showerName) => api.get(`/sessions/shower/${showerName}/consensus`)
}

export const recordAPI = {
  add: (sessionId, data) => api.post(`/records/session/${sessionId}`, data),
  get: (id) => api.get(`/records/${id}`),
  getBySession: (sessionId) => api.get(`/records/session/${sessionId}`),
  count: (sessionId) => api.get(`/records/session/${sessionId}/count`),
  delete: (id) => api.delete(`/records/${id}`)
}

export default api
