import request from '@/utils/request'

export const useGroupApi = () => {
  return {
    getMyGroups: () => request.get('/groups'),
    getGroupDetail: (id) => request.get(`/groups/${id}`),
    getGroupMessages: (id) => request.get(`/groups/${id}/messages`),
    sendMessage: (id, data) => request.post(`/groups/${id}/messages`, data),
    completeTrip: (id) => request.post(`/groups/${id}/complete`),
    cancelTrip: (groupId, cancelUserId) => 
      request.post(`/groups/${groupId}/cancel/${cancelUserId}`)
  }
}
