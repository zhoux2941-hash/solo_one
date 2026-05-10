import request from '@/utils/request'

export function getAllBloomingPredictions() {
  return request({
    url: '/blooming',
    method: 'get'
  })
}

export function getBloomingPrediction(sourceId) {
  return request({
    url: `/blooming/${sourceId}`,
    method: 'get'
  })
}

export function initNectarSources() {
  return request({
    url: '/blooming/init',
    method: 'post'
  })
}
