import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const toiletApi = {
  getAllToilets() {
    return apiClient.get('/toilets')
  },
  getAlerts() {
    return apiClient.get('/alerts')
  },
  refillPaper(stallId) {
    return apiClient.post(`/alerts/refill/${stallId}`)
  }
}

export default toiletApi
