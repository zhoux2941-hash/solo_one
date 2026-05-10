import request from '@/utils/request'

export const useTripApi = () => {
  return {
    createTrip: (data) => request.post('/trips', data),
    searchTrips: (data) => request.post('/trips/search', data),
    getHotTrips: () => request.get('/trips/hot'),
    getRecentTrips: () => request.get('/trips/recent'),
    getMyTrips: () => request.get('/trips/mine'),
    getTripDetail: (id) => request.get(`/trips/${id}`)
  }
}
