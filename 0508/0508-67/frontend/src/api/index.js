import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getMachinesStatus = () => api.get('/machines/status')
export const simulateMachineReport = (machineId) => api.post(`/machines/${machineId}/simulate`)
export const refilMachine = (machineId) => api.post(`/machines/${machineId}/refil`)
export const getMachineHistory = (machineId) => api.get(`/machines/${machineId}/history`)

export const getAllOrders = () => api.get('/orders')
export const getPendingOrders = () => api.get('/orders/pending')
export const deliverOrder = (orderId) => api.post(`/orders/${orderId}/deliver`)
export const getResponseTimeHistogram = () => api.get('/orders/response-time/histogram')

export const getConsumptionRates = () => api.get('/analytics/consumption-rates')
export const getMachineConsumptionHistory = (machineId, hours = 24) => 
  api.get(`/analytics/machine/${machineId}/history`, { params: { hours } })
export const getRateTrend = (machineId, hours = 24) => 
  api.get(`/analytics/machine/${machineId}/rate-trend`, { params: { hours } })

export const getRestockRecommendations = () => api.get('/prediction/recommendations')
export const getPredictionSummary = () => api.get('/prediction/summary')

export const getAllInventories = () => api.get('/inventory')
export const getInventoryByFloor = (floor) => api.get(`/inventory/${floor}`)
export const updateInventory = (data) => api.post('/inventory', data)
export const restockFloor = (floor, quantity) => api.post(`/inventory/${floor}/restock`, { quantity })
export const initializeInventory = () => api.post('/inventory/initialize')

export default api
