import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const driverApi = {
  getAll: () => api.get('/drivers'),
  getEnergies: () => api.get('/drivers/energies'),
  resetEnergies: () => api.post('/drivers/reset-energies')
}

export const schedulingApi = {
  generate: (data) => api.post('/scheduling/generate', data),
  getToday: () => api.get('/scheduling/today'),
  reset: () => api.post('/scheduling/reset')
}

export default api
