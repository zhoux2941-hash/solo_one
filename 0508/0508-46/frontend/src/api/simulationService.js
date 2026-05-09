import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const simulationService = {
  async getParams() {
    const response = await api.get('/simulation/params')
    return response.data
  },

  async saveParams(params) {
    const response = await api.post('/simulation/params', params)
    return response.data
  },

  async runSimulation() {
    const response = await api.post('/simulation/run')
    return response.data
  },

  async runMonteCarlo() {
    const response = await api.post('/simulation/montecarlo')
    return response.data
  },

  async optimizeSlideTime() {
    const response = await api.post('/simulation/optimize')
    return response.data
  },

  async getHistory() {
    const response = await api.get('/simulation/history')
    return response.data
  }
}
