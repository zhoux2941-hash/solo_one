import request from '../utils/request'

export function getAllActors() {
  return request.get('/users/actors')
}