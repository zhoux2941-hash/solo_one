import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api/team'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const teamService = {
  async getTeamRanking() {
    const response = await api.get('/rank')
    return response.data
  },

  async getTeamContribution(employeeNo) {
    const response = await api.get(`/contribution/${employeeNo}`)
    return response.data
  },

  async getCheckinTrend(employeeNo) {
    const response = await api.get(`/trend/${employeeNo}`)
    return response.data
  },

  async getCurrentTeam(employeeNo) {
    const response = await api.get(`/my-team/${employeeNo}`)
    return response.data
  },

  async createTeam(employeeNo, name, description) {
    const response = await api.post('/create', {
      employeeNo,
      name,
      description
    })
    return response.data
  },

  async joinTeam(employeeNo, teamId) {
    const response = await api.post('/join', {
      employeeNo,
      teamId
    })
    return response.data
  }
}

export default teamService
