import axios from 'axios';
import { ApiResponse, User, LoginRequest, LoginResponse, Package, Coach, TimeSlot, Booking, CreateBookingRequest, Earning, Settlement, MemberProfile, MemberPackage, ExpirationReminder } from '../../shared/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
  return response.data.data!;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data!;
}

export async function getPackages(): Promise<Package[]> {
  const response = await api.get<ApiResponse<Package[]>>('/packages');
  return response.data.data!;
}

export async function purchasePackage(packageId: number): Promise<void> {
  await api.post(`/packages/${packageId}/purchase`);
}

export async function getCoaches(): Promise<Coach[]> {
  const response = await api.get<ApiResponse<Coach[]>>('/coaches');
  return response.data.data!;
}

export async function getCoachAvailableSlots(coachId: number, date: string): Promise<TimeSlot[]> {
  const response = await api.get<ApiResponse<TimeSlot[]>>(`/coaches/${coachId}/available-slots?date=${date}`);
  return response.data.data!;
}

export async function createBooking(data: CreateBookingRequest): Promise<void> {
  await api.post('/bookings', data);
}

export async function getMemberBookings(): Promise<Booking[]> {
  const response = await api.get<ApiResponse<Booking[]>>('/bookings/member');
  return response.data.data!;
}

export async function getCoachBookings(date?: string): Promise<Booking[]> {
  const url = date ? `/bookings/coach?date=${date}` : '/bookings/coach';
  const response = await api.get<ApiResponse<Booking[]>>(url);
  return response.data.data!;
}

export async function startBooking(bookingId: number): Promise<void> {
  await api.patch(`/bookings/${bookingId}/start`);
}

export async function completeBooking(bookingId: number): Promise<void> {
  await api.patch(`/bookings/${bookingId}/complete`);
}

export async function cancelBooking(bookingId: number): Promise<void> {
  await api.delete(`/bookings/${bookingId}`);
}

export async function getEarnings(): Promise<Earning[]> {
  const response = await api.get<ApiResponse<Earning[]>>('/coach/earnings');
  return response.data.data!;
}

export async function getSettlements(): Promise<Settlement[]> {
  const response = await api.get<ApiResponse<Settlement[]>>('/coach/settlements');
  return response.data.data!;
}

export async function getMemberPackages(): Promise<MemberPackage[]> {
  const response = await api.get<ApiResponse<MemberPackage[]>>('/member/packages');
  return response.data.data!;
}

export async function getExpirationReminders(): Promise<ExpirationReminder> {
  const response = await api.get<ApiResponse<ExpirationReminder>>('/member/expiration-reminders');
  return response.data.data!;
}



export default api;
