import request from '@/utils/request'

export function getMyApprovalList(params) {
  return request({
    url: '/approval/my',
    method: 'get',
    params
  })
}

export function getPendingApprovalList(params) {
  return request({
    url: '/approval/pending',
    method: 'get',
    params
  })
}

export function getHistoryApprovalList(params) {
  return request({
    url: '/approval/history',
    method: 'get',
    params
  })
}

export function getApproval(id) {
  return request({
    url: `/approval/${id}`,
    method: 'get'
  })
}

export function applyApproval(data) {
  return request({
    url: '/approval/apply',
    method: 'post',
    data
  })
}

export function auditApproval(data) {
  return request({
    url: '/approval/audit',
    method: 'post',
    data
  })
}

export function withdrawApproval(id) {
  return request({
    url: `/approval/withdraw/${id}`,
    method: 'post'
  })
}
