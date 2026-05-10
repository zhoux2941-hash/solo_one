import request from '@/utils/request'

export function createRecord(data) {
  return request.post('/records', data)
}

export function getRecordsByUser(userId) {
  return request.get(`/records/user/${userId}`)
}

export function getLureRecommendations(params) {
  return request.get('/records/recommendations', { params })
}

export function getHeatmap() {
  return request.get('/records/heatmap')
}

export function getAllSpecies() {
  return request.get('/records/species')
}

export function getAllLures() {
  return request.get('/records/lures')
}

export function createSpot(data) {
  return request.post('/spots', data)
}

export function getSpotsByUser(userId) {
  return request.get(`/spots/user/${userId}`)
}

export function getNearbySpots(params) {
  return request.get('/spots/nearby', { params })
}
