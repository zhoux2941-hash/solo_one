import request from '@/utils/request'

export function getCropTypeStats() {
  return request({
    url: '/api/stats/crop-type',
    method: 'get'
  })
}

export function getPestNameStats() {
  return request({
    url: '/api/stats/pest-name',
    method: 'get'
  })
}