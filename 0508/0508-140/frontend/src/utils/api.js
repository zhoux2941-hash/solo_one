import request from './request'

export const getClassicList = (type) => {
  return request.get('/classic/list', { params: { type } })
}

export const getClassicById = (id) => {
  return request.get(`/classic/${id}`)
}

export const saveUserPottery = (data) => {
  return request.post('/user/save', data)
}

export const getUserPotteryById = (id) => {
  return request.get(`/user/${id}`)
}

export const getUserPotteryList = (userId) => {
  return request.get(`/user/list/${userId}`)
}

export const createShare = (data) => {
  return request.post('/share/create', data)
}

export const getShareByCode = (shareCode) => {
  return request.get(`/share/${shareCode}`)
}
