import request from '@/utils/request'

export function getBeehives() {
  return request({
    url: '/beehives',
    method: 'get'
  })
}

export function getBeehive(id) {
  return request({
    url: `/beehives/${id}`,
    method: 'get'
  })
}

export function createBeehive(data) {
  return request({
    url: '/beehives',
    method: 'post',
    data
  })
}

export function updateBeehive(id, data) {
  return request({
    url: `/beehives/${id}`,
    method: 'put',
    data
  })
}

export function deleteBeehive(id) {
  return request({
    url: `/beehives/${id}`,
    method: 'delete'
  })
}
