import request from '@/utils/request'

export const useAuthApi = () => {
  return {
    login: (data) => request.post('/auth/login', data),
    register: (data) => request.post('/auth/register', data)
  }
}
