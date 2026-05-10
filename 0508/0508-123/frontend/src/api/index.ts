import axios from 'axios'
import type { 
  Telescope, SlotInfo, Booking, BookingRequest, BookingResponse, 
  ImageStatus, ObservationImage,
  GuideStarCatalog, GuideStarRequest, GuideStarResponse
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const telescopeApi = {
  getAll: () => api.get<Telescope[]>('/telescopes'),
  getById: (id: number) => api.get<Telescope>(`/telescopes/${id}`),
  create: (telescope: Omit<Telescope, 'id'>) => api.post<Telescope>('/telescopes', telescope),
  update: (id: number, telescope: Partial<Telescope>) => api.put<Telescope>(`/telescopes/${id}`, telescope),
  delete: (id: number) => api.delete(`/telescopes/${id}`)
}

export const bookingApi = {
  create: (booking: BookingRequest) => api.post<BookingResponse>('/bookings', booking),
  getSlots: (telescopeId: number, date: string) => 
    api.get<SlotInfo[]>(`/bookings/slots/${telescopeId}`, { params: { date } }),
  getByUser: (userId: string) => api.get<Booking[]>(`/bookings/user/${userId}`),
  getById: (id: number) => api.get<Booking>(`/bookings/${id}`),
  cancel: (id: number, userId: string) => 
    api.delete(`/bookings/${id}`, { params: { userId } })
}

export const imageApi = {
  getByBooking: (bookingId: number) => api.get<ObservationImage>(`/images/booking/${bookingId}`),
  getStatus: (bookingId: number) => api.get<ImageStatus>(`/images/status/${bookingId}`),
  downloadCalibrated: (bookingId: number) => 
    axios.get(`/api/images/download/calibrated/${bookingId}`, { responseType: 'blob' })
}

export const guideStarApi = {
  getCatalog: () => api.get<GuideStarCatalog[]>('/guide-star/catalog'),
  getRecommended: (targetRa: number, targetDec: number, time: string) => 
    api.get<GuideStarCatalog[]>('/guide-star/recommend', { 
      params: { targetRa, targetDec, time } 
    }),
  simulate: (request: GuideStarRequest) => 
    api.post<GuideStarResponse>('/guide-star/simulate', request)
}

export default api
