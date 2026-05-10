import request from '@/utils/request'

export const useRequestApi = () => {
  return {
    createRequest: (tripId, data) => request.post(`/requests/trip/${tripId}`, data),
    getMyRequests: () => request.get('/requests/mine'),
    getReceivedRequests: () => request.get('/requests/received'),
    respondToRequest: (requestId, action) => 
      request.post(`/requests/${requestId}/respond`, { action })
  }
}
