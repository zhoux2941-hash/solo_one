import api from './index'

export default {
  getByPool(poolId) {
    return api.get(`/allocations/pool/${poolId}`)
  },
  getByEmployee(employeeId) {
    return api.get(`/allocations/employee/${employeeId}`)
  },
  batchAllocate(data) {
    return api.post('/allocations/batch', data)
  },
  getVersions(allocationId) {
    return api.get(`/allocations/${allocationId}/versions`)
  },
  compareVersions(allocationId, v1, v2) {
    return api.get(`/allocations/${allocationId}/diff?v1=${v1}&v2=${v2}`)
  },
  confirm(allocationId) {
    return api.put(`/allocations/${allocationId}/confirm`)
  }
}
