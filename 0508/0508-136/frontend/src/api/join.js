import request from '@/utils/request'

export function getJoinTypes() {
  return request({
    url: '/join-types',
    method: 'get'
  })
}

export function calculateJoin(data) {
  return request({
    url: '/join/calculate',
    method: 'post',
    data
  })
}

export function exportStl(data) {
  return request({
    url: '/join/export/stl',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

export function exportPdf(data) {
  return request({
    url: '/join/export/pdf',
    method: 'post',
    data,
    responseType: 'blob'
  })
}