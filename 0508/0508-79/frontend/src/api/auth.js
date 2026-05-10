import request from './request'

export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}
