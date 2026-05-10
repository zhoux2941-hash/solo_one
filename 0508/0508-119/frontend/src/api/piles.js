import request from '@/utils/request'

export function getPiles() {
  return request({
    url: '/charging-piles/public/list',
    method: 'get'
  })
}

export function getPileById(id) {
  return request({
    url: `/charging-piles/public/${id}`,
    method: 'get'
  })
}

export function getPileByCode(code) {
  return request({
    url: `/charging-piles/public/code/${code}`,
    method: 'get'
  })
}

export function getPileStatus(id) {
  return request({
    url: `/charging-piles/public/status/${id}`,
    method: 'get'
  })
}

export function getAvailableSlots(id) {
  return request({
    url: `/charging-piles/public/available-slots/${id}`,
    method: 'get'
  })
}

export function createPile(data) {
  return request({
    url: '/charging-piles',
    method: 'post',
    data
  })
}

export function updatePile(id, data) {
  return request({
    url: `/charging-piles/${id}`,
    method: 'put',
    data
  })
}

export function updatePileStatus(id, status) {
  return request({
    url: `/charging-piles/${id}/status/${status}`,
    method: 'put'
  })
}

export function deletePile(id) {
  return request({
    url: `/charging-piles/${id}`,
    method: 'delete'
  })
}
