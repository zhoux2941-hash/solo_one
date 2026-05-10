import request from '@/utils/request'

export function createObservation(data) {
  return request({
    url: '/observations',
    method: 'post',
    data
  })
}

export function getObservationsByStar(starId) {
  return request({
    url: `/observations/star/${starId}`,
    method: 'get'
  })
}

export function getLightCurveData(starId) {
  return request({
    url: `/observations/lightcurve/${starId}`,
    method: 'get'
  })
}

export function exportObservations(starId) {
  return request({
    url: `/observations/export/${starId}`,
    method: 'get',
    responseType: 'blob'
  })
}

export function clearCache(starId) {
  return request({
    url: `/observations/cache/${starId}`,
    method: 'delete'
  })
}
