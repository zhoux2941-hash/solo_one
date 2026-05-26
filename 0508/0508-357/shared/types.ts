export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'member' | 'coach' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface MemberProfile {
  userId: number;
  memberId: number;
  remainingClasses: number;
  totalPurchased: number;
  totalUsed: number;
}

export interface MemberPackage {
  id: number;
  memberId: number;
  packageId: number;
  packageName: string;
  remainingClasses: number;
  expireDate: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
  daysRemaining: number;
  purchasedAt: string;
}

export interface ExpirationReminder {
  memberId: number;
  memberName: string;
  packages: MemberPackage[];
  totalExpiringClasses: number;
}

export interface Package {
  id: number;
  name: string;
  classes: number;
  price: number;
  originalPrice: number;
  validityDays: number;
  description: string;
  isRecommended: boolean;
}

export interface Coach {
  id: number;
  userId: number;
  name: string;
  avatar: string;
  specialty: string;
  bio: string;
  rating: number;
  totalClasses: number;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Booking {
  id: number;
  memberId: number;
  memberName: string;
  coachId: number;
  coachName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Earning {
  id: number;
  coachId: number;
  bookingId: number;
  memberName: string;
  amount: number;
  classDate: string;
  startTime: string;
  endTime: string;
  settlementId?: number;
  createdAt: string;
}

export interface Settlement {
  id: number;
  coachId: number;
  month: string;
  startDate: string;
  endDate: string;
  totalClasses: number;
  totalAmount: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
  role: 'member' | 'coach';
}

export interface LoginResponse {
  token: string;
  user: User;
  memberProfile?: MemberProfile;
}

export interface CreateBookingRequest {
  coachId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
