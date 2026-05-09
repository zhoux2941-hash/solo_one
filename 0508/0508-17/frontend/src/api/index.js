import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const seatApi = {
  getAllSeats: () => api.get('/seats'),
  getSeatById: (id) => api.get(`/seats/${id}`),
  getAreas: () => api.get('/seats/areas'),
  getSeatStatus: (area, date) => api.get('/seats/status', { params: { area, date } }),
  createSeat: (seat) => api.post('/seats', seat),
  deleteSeat: (id) => api.delete(`/seats/${id}`)
}

export const bookingApi = {
  createBooking: (data) => api.post('/bookings', data),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  getBookingsByDate: (date) => api.get(`/bookings/date/${date}`),
  getBookingsBySeatAndDate: (seatId, date) => api.get(`/bookings/seat/${seatId}/date/${date}`),
  getBookingsByUserAndDate: (userId, date) => api.get(`/bookings/user/${userId}/date/${date}`)
}

export const analyticsApi = {
  getUsageRate: (startDate, endDate) => api.get('/analytics/usage', { params: { startDate, endDate } }),
  getTopSeats: (limit = 5) => api.get('/analytics/top-seats', { params: { limit } }),
  predictAvailable: () => api.get('/analytics/predict-available')
}

export const checkInApi = {
  checkIn: (bookingId) => api.post(`/checkin/${bookingId}`),
  simulateCheckIn: (userId, seatId) => api.post('/checkin/simulate', null, { params: { userId, seatId } }),
  getUserConfirmedBookings: (userId) => api.get(`/checkin/user/${userId}/bookings`)
}

export default api
