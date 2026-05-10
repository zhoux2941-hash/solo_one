import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me')
}

export const observationApi = {
  create: (data) => api.post('/observations', data),
  getMy: () => api.get('/observations/my'),
  getByBbox: (data) => api.post('/observations/public/by-bbox', data),
  getAreaStats: (data) => api.post('/observations/public/stats', data),
  getLocationHistory: (locationId) => api.get(`/observations/public/location/${locationId}/history`)
}

export const heatmapApi = {
  generate: (data) => api.post('/heatmap/generate', data),
  contour: (data) => api.post('/heatmap/contour', data)
}

export const astronomyApi = {
  getPrediction: (latitude, longitude) => api.get(`/astronomy/prediction?latitude=${latitude}&longitude=${longitude}`)
}

export const challengeApi = {
  start: (data) => api.post('/challenges/start', data),
  checkin: (data) => api.post('/challenges/checkin', data),
  getUserChallenges: () => api.get('/challenges'),
  getActive: () => api.get('/challenges/active')
}

export default api
