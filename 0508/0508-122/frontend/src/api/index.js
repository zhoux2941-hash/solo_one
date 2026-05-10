import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const transitApi = {
  simulate(params) {
    return api.post('/transit/simulate', params)
  }
}

export const fitApi = {
  calculate(params) {
    return api.post('/fit/calculate', params)
  },
  save(params) {
    return api.post('/fit/save', params)
  },
  getByToken(token) {
    return api.get(`/fit/${token}`)
  }
}

export const starApi = {
  getAllTemplates() {
    return api.get('/stars')
  }
}

export const predictionApi = {
  predictTransit(params) {
    return api.post('/prediction/transit', params)
  }
}

export default api