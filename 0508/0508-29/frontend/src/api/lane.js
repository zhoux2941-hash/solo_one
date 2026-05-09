import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export function getAllLanes() {
  return apiClient.get('/lanes')
}

export function getLanesByDate(date) {
  return apiClient.get(`/lanes/date/${date}`)
}

export function getLanesByZone(zone) {
  return apiClient.get(`/lanes/zone/${zone}`)
}

export function getDailyAverages(startDate, endDate) {
  return apiClient.get('/lanes/daily-averages', {
    params: { startDate, endDate }
  })
}

