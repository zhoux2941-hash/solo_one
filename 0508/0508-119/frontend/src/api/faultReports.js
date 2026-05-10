import request from '@/utils/request'

export function getMyReports() {
  return request({
    url: '/fault-reports/my',
    method: 'get'
  })
}

export function getAllReports(status) {
  const params = status ? { status } : {}
  return request({
    url: '/fault-reports',
    method: 'get',
    params
  })
}

export function getReportById(id) {
  return request({
    url: `/fault-reports/${id}`,
    method: 'get'
  })
}

export function createReport(data) {
  return request({
    url: '/fault-reports',
    method: 'post',
    data
  })
}

export function processReport(id) {
  return request({
    url: `/fault-reports/${id}/process`,
    method: 'put'
  })
}

export function resolveReport(id, handleNote) {
  return request({
    url: `/fault-reports/${id}/resolve`,
    method: 'put',
    data: { handleNote }
  })
}

export function rejectReport(id, handleNote) {
  return request({
    url: `/fault-reports/${id}/reject`,
    method: 'put',
    data: { handleNote }
  })
}
