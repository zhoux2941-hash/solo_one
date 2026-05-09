import axios from 'axios'

const API_BASE = '/api/benches'

export const benchStatsApi = {
  getWeatherTypes: () => {
    return axios.get(`${API_BASE}/weather/types`)
  },

  getTodayStats: (weather = null) => {
    const params = weather ? { params: { weather } } : {}
    return axios.get(`${API_BASE}/stats/today`, params)
  },

  getStatsByDate: (date, weather = null) => {
    const params = weather ? { params: { weather } } : {}
    return axios.get(`${API_BASE}/stats/date/${date}`, params)
  },

  getSummary: (weather = null) => {
    const params = weather ? { params: { weather } } : {}
    return axios.get(`${API_BASE}/summary`, params)
  }
}
