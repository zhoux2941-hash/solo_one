import axios from 'axios'

const DEFAULT_RESTAURANT_ID = 1

const getRestaurantId = () => {
  return localStorage.getItem('restaurantId') || DEFAULT_RESTAURANT_ID
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const restaurantId = getRestaurantId()
  if (restaurantId) {
    config.headers['X-Restaurant-Id'] = restaurantId
  }
  return config
})

export const queueApi = {
  enqueue: (data) => {
    const restaurantId = getRestaurantId()
    if (!data.restaurantId) {
      data.restaurantId = Number(restaurantId)
    }
    return api.post('/queue/enqueue', data)
  },
  callNext: () => api.post('/queue/call-next'),
  complete: (queueId) => api.post(`/queue/complete/${queueId}`),
  skip: (queueId) => api.post(`/queue/skip/${queueId}`),
  getStatus: (queueId) => api.get(`/queue/status/${queueId}`),
  getActive: () => api.get('/queue/active'),
  getWaiting: () => api.get('/queue/waiting'),
  predictWait: (partySize, restaurantId = null) => {
    let url = `/queue/predict?partySize=${partySize}`
    if (restaurantId) {
      url += `&restaurantId=${restaurantId}`
    }
    return api.get(url)
  },
  getConfig: () => api.get('/queue/config')
}

export const analyticsApi = {
  getTraffic: (days = 7, restaurantId = null) => {
    let url = `/analytics/traffic?days=${days}`
    if (restaurantId) {
      url += `&restaurantId=${restaurantId}`
    }
    return api.get(url)
  },
  getTurnover: (hours = 24, restaurantId = null) => {
    let url = `/analytics/turnover?hours=${hours}`
    if (restaurantId) {
      url += `&restaurantId=${restaurantId}`
    }
    return api.get(url)
  },
  getOverview: (restaurantId = null) => {
    let url = '/analytics/overview'
    if (restaurantId) {
      url += `?restaurantId=${restaurantId}`
    }
    return api.get(url)
  }
}

export const restaurantApi = {
  setCurrent: (restaurantId) => {
    localStorage.setItem('restaurantId', restaurantId)
  },
  getCurrent: () => {
    return Number(getRestaurantId())
  },
  getDefault: () => DEFAULT_RESTAURANT_ID
}

export default api
