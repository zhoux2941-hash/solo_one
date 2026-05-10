import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getMaterials = () => {
  return api.get('/materials')
}

export const checkKitRate = (orderQuantity) => {
  return api.get('/materials/check', {
    params: { orderQuantity }
  })
}
