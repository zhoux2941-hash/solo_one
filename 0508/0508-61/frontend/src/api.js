import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export const parcelAPI = {
  allocate: (parcels) => api.post('/parcels/allocate', parcels),
  getAllocation: (batchId) => api.get(`/parcels/allocation/${batchId}`),
  getShelfStatus: () => api.get('/parcels/shelf-status'),
  resetShelf: () => api.post('/parcels/reset'),
  getAllParcels: () => api.get('/parcels'),
  getPickupList: () => api.get('/parcels/pickup-list'),
  pickupByCode: (code) => api.post(`/parcels/pickup?code=${code}`),
  getParcel: (parcelNo) => api.get(`/parcels/${parcelNo}`),
  deleteParcel: (id) => api.delete(`/parcels/${id}`)
}

export default api
