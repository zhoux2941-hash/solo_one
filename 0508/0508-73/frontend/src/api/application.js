import request from '../utils/request'

export function createApplication(data) {
  return request({
    url: '/applications',
    method: 'post',
    data
  })
}

export function getMyApplications() {
  return request({
    url: '/applications/my',
    method: 'get'
  })
}

export function getPendingFirstReview() {
  return request({
    url: '/applications/pending-first-review',
    method: 'get'
  })
}

export function getPendingSecondReview() {
  return request({
    url: '/applications/pending-second-review',
    method: 'get'
  })
}

export function getOverdueApplications() {
  return request({
    url: '/applications/overdue',
    method: 'get'
  })
}

export function firstReview(applicationId, approved, comment) {
  return request({
    url: '/applications/first-review',
    method: 'post',
    data: { applicationId, approved, comment }
  })
}

export function secondReview(applicationId, approved, comment) {
  return request({
    url: '/applications/second-review',
    method: 'post',
    data: { applicationId, approved, comment }
  })
}

export function returnChemical(applicationId, overdueReason) {
  return request({
    url: '/applications/return',
    method: 'post',
    data: { applicationId, overdueReason }
  })
}

export function getApplicationById(id) {
  return request({
    url: `/applications/${id}`,
    method: 'get'
  })
}

export function getRemainingTime(id) {
  return request({
    url: `/applications/${id}/remaining-time`,
    method: 'get'
  })
}
