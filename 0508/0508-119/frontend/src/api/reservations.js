import request from '@/utils/request'

export function getMyReservations() {
  return request({
    url: '/reservations/my',
    method: 'get'
  })
}

export function getReservationById(id) {
  return request({
    url: `/reservations/${id}`,
    method: 'get'
  })
}

export function createReservation(data) {
  return request({
    url: '/reservations',
    method: 'post',
    data
  })
}

export function useReservation(id) {
  return request({
    url: `/reservations/${id}/use`,
    method: 'put'
  })
}

export function completeReservation(id) {
  return request({
    url: `/reservations/${id}/complete`,
    method: 'put'
  })
}

export function cancelReservation(id) {
  return request({
    url: `/reservations/${id}/cancel`,
    method: 'put'
  })
}
