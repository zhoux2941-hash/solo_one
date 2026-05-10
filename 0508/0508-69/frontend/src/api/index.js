import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getDashboardData = () => {
  return api.get('/ph/dashboard')
}

export const getTanks = () => {
  return api.get('/ph/tanks')
}

export const getTankDataByRange = (tankName, startTime, endTime) => {
  return api.get(`/ph/tank/${tankName}`, {
    params: { startTime, endTime }
  })
}

export const getAllTanksByRange = (startTime, endTime) => {
  return api.get('/ph/range', {
    params: { startTime, endTime }
  })
}

export const getConfig = () => {
  return api.get('/ph/config')
}

export default api
