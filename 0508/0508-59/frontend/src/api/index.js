import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    return Promise.reject(error)
  }
)

export const api = {
  getTeaBases: () => request.get('/tea-bases'),
  getToppings: () => request.get('/toppings'),
  predict: (data) => request.post('/predict', data),
  getRecords: (limit = 10) => request.get(`/records?limit=${limit}`),
  submitFeedback: (data) => request.post('/feedback', data),
  getLearnedCombos: (limit = 10) => request.get(`/learned-combos?limit=${limit}`)
}

export default request
