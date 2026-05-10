import request from '@/utils/request'

export function getStarList(params) {
  return request({
    url: '/stars',
    method: 'get',
    params
  })
}

export function getStarDetail(id) {
  return request({
    url: `/stars/${id}`,
    method: 'get'
  })
}

export function getStarTypes() {
  return request({
    url: '/stars/types',
    method: 'get'
  })
}

export function getConstellations() {
  return request({
    url: '/stars/constellations',
    method: 'get'
  })
}
