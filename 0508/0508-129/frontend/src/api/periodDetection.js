import request from '@/utils/request'

export function detectPeriod(data) {
  return request({
    url: '/period/detect',
    method: 'post',
    data
  })
}

export function detectPeriodForStar(starId) {
  return request({
    url: `/period/star/${starId}`,
    method: 'get'
  })
}

export function uploadAndDetect(file, params) {
  const formData = new FormData()
  formData.append('file', file)
  if (params.starId) formData.append('starId', params.starId)
  if (params.smoothMethod) formData.append('smoothMethod', params.smoothMethod)
  if (params.windowSize) formData.append('windowSize', params.windowSize)
  if (params.phaseBins) formData.append('phaseBins', params.phaseBins)
  if (params.useCustomPeriod) formData.append('useCustomPeriod', params.useCustomPeriod)
  if (params.customPeriod) formData.append('customPeriod', params.customPeriod)
  if (params.customEpoch) formData.append('customEpoch', params.customEpoch)

  return request({
    url: '/period/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
