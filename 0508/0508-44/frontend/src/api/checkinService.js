import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api/checkin'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const checkinService = {
  async checkin(employeeNo, imageBase64, fileName) {
    const response = await api.post('', {
      employeeNo,
      imageBase64,
      fileName
    })
    return response.data
  },

  async getLeaderboard() {
    const response = await api.get('/leaderboard')
    return response.data
  },

  async getEmployeeInfo(employeeNo) {
    const response = await api.get(`/employee/${employeeNo}`)
    return response.data
  },

  async getCheckinRecords(employeeNo) {
    const response = await api.get(`/records/${employeeNo}`)
    return response.data
  }
}

export default checkinService
