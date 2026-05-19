import request from '@/utils/request'

export function getLogList(params) {
  return request({
    url: '/log/list',
    method: 'get',
    params
  })
}

export function exportLog(params) {
  return request({
    url: '/log/export',
    method: 'get',
    params
  })
}
