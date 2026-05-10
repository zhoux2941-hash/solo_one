import axios from 'axios'

const api = axios.create({
  baseURL: '/api/battery',
  timeout: 10000
})

export const simulateBattery = (rideTime, temperature) => {
  return api.post('/simulate', { rideTime, temperature })
}

export const simulateMultiDay = (params) => {
  return api.post('/simulate/multi-day', params)
}

export const getHistory = () => {
  return api.get('/history')
}

export const clearHistory = () => {
  return api.delete('/history')
}

export const getLogs = () => {
  return api.get('/logs')
}

export default api