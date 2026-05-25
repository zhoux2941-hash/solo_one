export enum RecordType {
  ENTRY_REGISTRATION = 'ENTRY_REGISTRATION',
  WASH_COMPLETION = 'WASH_COMPLETION',
  SAMPLING_REVIEW = 'SAMPLING_REVIEW',
  EXIT_RELEASE = 'EXIT_RELEASE',
}

export enum VehicleStatus {
  WAITING_ENTRY = 'WAITING_ENTRY',
  WAITING_WASH = 'WAITING_WASH',
  WASHING = 'WASHING',
  WAITING_SAMPLING = 'WAITING_SAMPLING',
  SAMPLING = 'SAMPLING',
  WAITING_EXIT = 'WAITING_EXIT',
  EXITED = 'EXITED',
  ABNORMAL = 'ABNORMAL',
}

export enum AnomalyType {
  WASH_TIMEOUT = 'WASH_TIMEOUT',
  SAMPLING_FAILED = 'SAMPLING_FAILED',
  RECORD_MISSING = 'RECORD_MISSING',
  ABNORMAL_CHECK = 'ABNORMAL_CHECK',
  OTHER = 'OTHER',
}

export interface WashRecord {
  id: string;
  chainId: string;
  plateNumber: string;
  recordType: RecordType;
  operator: string;
  timestamp: number;
  remarks?: string;
  data?: Record<string, any>;
  anomalyId?: string;
}

export interface VehicleStatusInfo {
  plateNumber: string;
  currentStatus: VehicleStatus;
  currentChainId: string | null;
  lastUpdateTime: number;
  lastAnomaly: AnomalyRecord | null;
  stageTimestamps: Partial<Record<RecordType, number>>;
}

export interface AnomalyRecord {
  id: string;
  plateNumber: string;
  chainId?: string;
  anomalyType: AnomalyType;
  description: string;
  timestamp: number;
  resolved: boolean;
  resolvedTime?: number;
  resolvedBy?: string;
  resolution?: string;
}

export interface ShiftSummary {
  id: string;
  shiftId: string;
  shiftName: string;
  startTime: number;
  endTime: number;
  totalVehicles: number;
  completedVehicles: number;
  abnormalVehicles: number;
  anomalyCounts: Record<AnomalyType, number>;
  pendingRecords: number;
  operatorStats: Record<string, number>;
  generatedAt: number;
  remarks?: string;
}

export interface TraceChain {
  chainId: string;
  plateNumber: string;
  records: WashRecord[];
  startTime: number;
  endTime?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABNORMAL';
  anomalies: AnomalyRecord[];
  durationMs?: number;
}

export interface EntryRegistrationData {
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  cargoType: string;
  hazardLevel: string;
  expectedWashType: string;
  operator: string;
  remarks?: string;
  timestamp?: number;
}

export interface WashCompletionData {
  plateNumber: string;
  washType: string;
  washDuration: number;
  detergent: string;
  waterTemp: number;
  pressure: number;
  operator: string;
  remarks?: string;
  timestamp?: number;
}

export interface SamplingReviewData {
  plateNumber: string;
  samplingPoints: string[];
  testItems: string[];
  testResult: 'PASS' | 'FAIL' | 'PENDING';
  tester: string;
  operator: string;
  remarks?: string;
  timestamp?: number;
}

export interface ExitReleaseData {
  plateNumber: string;
  gateNumber: string;
  destination: string;
  operator: string;
  remarks?: string;
  timestamp?: number;
}
