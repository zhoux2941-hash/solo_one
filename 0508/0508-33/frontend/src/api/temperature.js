import axios from 'axios'

const API_BASE_URL = '/api/temperature'
const ALARM_API_BASE_URL = '/api/alarms'

export const temperatureApi = {
  async getCurrentTemperature() {
    const response = await axios.get(`${API_BASE_URL}/current`)
    return response.data
  },

  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      return response.data === 'OK'
    } catch (error) {
      return false
    }
  }
}

export const alarmApi = {
  async getAlarmHistory(siloName = 'all', page = 0, size = 20) {
    const params = { siloName, page, size }
    const response = await axios.get(`${ALARM_API_BASE_URL}/history`, { params })
    return response.data
  },

  async getUnacknowledgedAlarms() {
    const response = await axios.get(`${ALARM_API_BASE_URL}/unacknowledged`)
    return response.data
  },

  async getAvailableSilos() {
    const response = await axios.get(`${ALARM_API_BASE_URL}/silos`)
    return response.data
  },

  async getAlarmStats() {
    const response = await axios.get(`${ALARM_API_BASE_URL}/stats`)
    return response.data
  },

  async acknowledgeAlarm(id) {
    const response = await axios.post(`${ALARM_API_BASE_URL}/${id}/acknowledge`)
    return response.data
  },

  async acknowledgeAllAlarms() {
    const response = await axios.post(`${ALARM_API_BASE_URL}/acknowledge-all`)
    return response.data
  },

  async getThreshold() {
    const response = await axios.get(`${ALARM_API_BASE_URL}/threshold`)
    return response.data
  }
}
