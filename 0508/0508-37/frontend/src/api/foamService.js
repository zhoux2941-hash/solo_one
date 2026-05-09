import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const foamApi = {
  async getGroupedHistory() {
    const response = await api.get('/foam/grouped')
    return response.data
  },

  async getHistory(machineId, startTime, endTime) {
    const params = {}
    if (machineId) params.machineId = machineId
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime

    const response = await api.get('/foam/history', { params })
    return response.data
  },

  async getStats(startTime, endTime) {
    const params = {}
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime

    const response = await api.get('/foam/stats', { params })
    return response.data
  },

  async generateMockData() {
    const response = await api.post('/foam/mock/generate')
    return response.data
  },

  async getHeatmap() {
    const response = await api.get('/heatmap/last24')
    return response.data
  },

  async evictHeatmapCache() {
    const response = await api.post('/heatmap/cache/evict')
    return response.data
  }
}

export default api
