import request from '../utils/request'

export function generateActivityQRCode(activityId, baseUrl) {
  let url = `/qrcode/activity/${activityId}`
  if (baseUrl) {
    url += `?baseUrl=${encodeURIComponent(baseUrl)}`
  }
  return request({
    url,
    method: 'get'
  })
}

export function parseQRCodeContent(content) {
  return request({
    url: '/qrcode/parse',
    method: 'post',
    data: { content }
  })
}
