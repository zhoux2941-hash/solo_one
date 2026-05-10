import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const predictPasses = (lat, lon) => {
  return api.get('/predict/passes', {
    params: { lat, lon }
  })
}

export const recordObservation = (data) => {
  return api.post('/observations', data)
}

export const getObservationsByPass = (passEventId) => {
  return api.get(`/observations/pass/${passEventId}`)
}

export const getObserverCount = (passEventId) => {
  return api.get(`/observations/count/${passEventId}`)
}

export const getHeatmapData = () => {
  return api.get('/observations/heatmap')
}

export const predictIridiumFlares = (lat, lon) => {
  return api.get('/iridium/flares', {
    params: { lat, lon }
  })
}

export const createNotificationSubscription = (data) => {
  return api.post('/notifications/subscribe', data)
}

export const getUserSubscriptions = (userIdentifier) => {
  return api.get(`/notifications/user/${userIdentifier}`)
}

export const getSubscription = (id) => {
  return api.get(`/notifications/${id}`)
}

export const updateSubscription = (id, data) => {
  return api.put(`/notifications/${id}`, data)
}

export const deleteSubscription = (id) => {
  return api.delete(`/notifications/${id}`)
}

export const toggleSubscription = (id, active) => {
  return api.put(`/notifications/${id}/toggle`, null, {
    params: { active }
  })
}

export default api
