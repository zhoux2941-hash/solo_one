import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getCurrentWear = () => {
  return apiClient.get('/wheelchairs/wear')
}

export const getYearOverYear = () => {
  return apiClient.get('/wheelchairs/year-over-year')
}

export const getWearPrediction = (wheelchairId) => {
  return apiClient.get(`/wheelchairs/${wheelchairId}/prediction`)
}
