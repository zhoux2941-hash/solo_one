import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getHistoricalData = (days = 30) => {
  return apiClient.get('/historical', { params: { days } })
}

export const getPrediction = (alpha = 0.3, days = 3) => {
  return apiClient.get('/prediction', { params: { alpha, days } })
}

export const getAllEvents = () => {
  return apiClient.get('/events')
}

export const getRecentEvents = (days = 60) => {
  return apiClient.get('/events/recent', { params: { days } })
}

export const addEvent = (event) => {
  return apiClient.post('/events', event)
}

export const updateEvent = (id, event) => {
  return apiClient.put(`/events/${id}`, event)
}

export const deleteEvent = (id) => {
  return apiClient.delete(`/events/${id}`)
}
