export interface RadiationSourceApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  sourceType: string;
  roomId: string;
  startTime: string;
  endTime: string;
  escorts: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
}

export interface ApplicationCreate {
  applicantId: string;
  applicantName: string;
  sourceType: string;
  roomId: string;
  startTime: string;
  endTime: string;
  escorts: string[];
}

export interface ApplicationUpdate {
  sourceType?: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  escorts?: string[];
}

export interface Room {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'maintenance';
}

export interface Escort {
  id: string;
  name: string;
  role: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  roomConflicts: string[];
  escortShortages: string[];
  sourceConflicts: string[];
  details: ConflictDetail[];
}

export interface ConflictDetail {
  type: 'room' | 'escort' | 'source';
  message: string;
  applicationId?: string;
  applicantName?: string;
}

export interface DailyReport {
  date: string;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  roomUtilization: { roomId: string; roomName: string; utilization: number }[];
  conflictCount: number;
}

export interface ConflictRollbackRecord {
  id: string;
  applicationId: string;
  applicantName: string;
  type: 'room' | 'escort' | 'source';
  roomId?: string;
  roomName?: string;
  escortId?: string;
  escortName?: string;
  sourceType?: string;
  startTime: string;
  endTime: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface ConflictAnalysis {
  date: string;
  totalConflicts: number;
  roomConflicts: number;
  escortConflicts: number;
  sourceConflicts: number;
  topConflictRooms: { roomId: string; roomName: string; count: number }[];
  topConflictEscorts: { escortId: string; escortName: string; count: number }[];
  recurringPatterns: { pattern: string; count: number }[];
}

export interface ScheduleViewData {
  viewType: 'room' | 'escort';
  date: string;
  items: ScheduleItem[];
}

export interface ScheduleItem {
  id: string;
  resourceId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  applicationId: string;
  applicantName: string;
  sourceType: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const RADIATION_SOURCES = [
  { id: 'co-60', name: '钴-60', type: 'γ射线源' },
  { id: 'ir-192', name: '铱-192', type: 'γ射线源' },
  { id: 'i-125', name: '碘-125', type: 'γ射线源' },
  { id: 'cs-137', name: '铯-137', type: 'γ射线源' },
];
