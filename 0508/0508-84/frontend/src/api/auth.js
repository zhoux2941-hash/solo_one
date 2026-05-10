import request from '../utils/request'

export function loginApi(username, password) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: { username, password }
  })
}

export function registerApi(username, password, realName, phone) {
  return request({
    url: '/auth/register',
    method: 'post',
    data: { username, password, realName, phone }
  })
}

export function getUserById(id) {
  return request({
    url: `/auth/user/${id}`,
    method: 'get'
  })
}
