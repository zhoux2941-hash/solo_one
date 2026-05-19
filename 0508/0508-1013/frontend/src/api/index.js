import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getBeds = () => request.get('/beds')
export const getBedByNo = (bedNo) => request.get(`/beds/${bedNo}`)

export const getTemperatureSnapshot = () => request.get('/temperature/snapshot')
export const getBedSnapshot = (bedNo) => request.get(`/temperature/snapshot/${bedNo}`)
export const getBedHistory = (bedNo, params) => request.get(`/temperature/history/${bedNo}`, { params })
export const getAbnormalRecords = () => request.get('/temperature/abnormal')
export const recordTemperature = (bedNo, temperature) => 
  request.post('/temperature/record', null, { params: { bedNo, temperature } })

export const startSimulation = () => request.post('/simulation/start')
export const stopSimulation = () => request.post('/simulation/stop')
export const getSimulationStatus = () => request.get('/simulation/status')
export const generateInitialData = () => request.post('/simulation/init-data')

export default request
