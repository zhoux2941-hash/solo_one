import request from '../utils/request'

export function getActiveActivities() {
  return request({
    url: '/activities',
    method: 'get'
  })
}

export function getAllActivities() {
  return request({
    url: '/activities/all',
    method: 'get'
  })
}

export function createActivity(data) {
  return request({
    url: '/activities',
    method: 'post',
    data
  })
}

export function updateActivity(id, data) {
  return request({
    url: `/activities/${id}`,
    method: 'put',
    data
  })
}

export function deleteActivity(id) {
  return request({
    url: `/activities/${id}`,
    method: 'delete'
  })
}
