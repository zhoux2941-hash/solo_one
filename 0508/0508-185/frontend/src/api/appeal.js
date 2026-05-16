import api from './index'

export default {
  getPending() {
    return api.get('/appeals/pending')
  },
  getByEmployee(employeeId) {
    return api.get(`/appeals/employee/${employeeId}`)
  },
  create(data) {
    return api.post('/appeals', data)
  },
  process(data) {
    return api.post('/appeals/process', data)
  }
}
