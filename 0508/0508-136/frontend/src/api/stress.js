import request from '@/utils/request'

export function getLoadDirections() {
  return request({
    url: '/stress/directions',
    method: 'get'
  })
}

export function simulateStress(data) {
  return request({
    url: '/stress/simulate',
    method: 'post',
    data
  })
}