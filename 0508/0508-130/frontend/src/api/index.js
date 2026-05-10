import request from '@/utils/request'

export const calculateForecast = (data) => {
  return request({
    url: '/forecast/calculate',
    method: 'post',
    data
  })
}

export const getForecastHistory = (params) => {
  return request({
    url: '/forecast/history',
    method: 'get',
    params
  })
}

export const calculateAllocation = (data) => {
  return request({
    url: '/allocation/calculate',
    method: 'post',
    data
  })
}

export const getWarehouses = () => {
  return request({
    url: '/allocation/warehouses',
    method: 'get'
  })
}

export const simulateConsumption = (data) => {
  return request({
    url: '/consumption/simulate',
    method: 'post',
    data
  })
}

export const comparePlans = (data) => {
  return request({
    url: '/consumption/compare',
    method: 'post',
    data
  })
}

export const generateTimeline = (data) => {
  return request({
    url: '/timeline/generate',
    method: 'post',
    data
  })
}

export const getDemoTimeline = () => {
  return request({
    url: '/timeline/demo',
    method: 'get'
  })
}
