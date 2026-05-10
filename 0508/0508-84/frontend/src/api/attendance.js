import request from '../utils/request'

export function checkIn(userId, activityId) {
  return request({
    url: '/attendance/checkin',
    method: 'post',
    data: { userId, activityId }
  })
}

export function checkOut(userId, activityId) {
  return request({
    url: '/attendance/checkout',
    method: 'post',
    data: { userId, activityId }
  })
}

export function getAttendanceByUser(userId) {
  return request({
    url: `/attendance/user/${userId}`,
    method: 'get'
  })
}

export function getPendingAttendance() {
  return request({
    url: '/attendance/pending',
    method: 'get'
  })
}

export function getUncheckedAttendance() {
  return request({
    url: '/attendance/unchecked',
    method: 'get'
  })
}

export function forceCheckOut(id, adminId, customMinutes) {
  const data = { adminId }
  if (customMinutes) {
    data.customMinutes = customMinutes
  }
  return request({
    url: `/attendance/force-checkout/${id}`,
    method: 'post',
    data
  })
}

export function approveAttendance(id, adminId) {
  return request({
    url: `/attendance/approve/${id}`,
    method: 'post',
    data: { adminId }
  })
}

export function rejectAttendance(id, adminId) {
  return request({
    url: `/attendance/reject/${id}`,
    method: 'post',
    data: { adminId }
  })
}

export function getTotalMinutes(userId) {
  return request({
    url: `/attendance/total/${userId}`,
    method: 'get'
  })
}
