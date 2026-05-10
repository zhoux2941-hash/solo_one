import request from '@/utils/request'

export function createReport(formData) {
  return request({
    url: '/api/report',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getPendingList() {
  return request({
    url: '/api/report/pending',
    method: 'get'
  })
}

export function getReportList(farmerId) {
  return request({
    url: `/api/report/farmer/${farmerId}`,
    method: 'get'
  })
}

export function getRecentReports() {
  return request({
    url: '/api/report/recent',
    method: 'get'
  })
}

export function getReportDetail(id) {
  return request({
    url: `/api/report/${id}`,
    method: 'get'
  })
}

export function diagnoseReport(id, data) {
  return request({
    url: `/api/report/${id}/diagnose`,
    method: 'put',
    data
  })
}

export function evaluateReport(id, data) {
  return request({
    url: `/api/report/${id}/evaluate`,
    method: 'put',
    data
  })
}