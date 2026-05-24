export interface Specimen {
  id: string;
  name: string;
  code: string;
  category: string;
  image?: string;
  originalCabinetId: string;
  originalPosition: Position;
  currentPosition?: Position;
  status: SpecimenStatus;
  checkoutDate?: string;
  returnDate?: string;
  description?: string;
}

export type SpecimenStatus = 'in-storage' | 'lent-out' | 'in-transit' | 'returned' | 'verified';

export interface Position {
  row: number;
  col: number;
}

export interface Seal {
  id: string;
  boxCode: string;
  specimenIds: string[];
  sealCode: string;
  sealedAt: string;
  unsealedAt?: string;
  status: SealStatus;
  destination?: string;
  notes?: string;
}

export type SealStatus = 'sealed' | 'in-transit' | 'unsealed';

export interface CabinetVersion {
  id: string;
  version: number;
  cabinetId: string;
  cabinetName: string;
  layout: CabinetSlot[];
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface CabinetSlot {
  position: Position;
  specimenId?: string;
  isLocked?: boolean;
}

export interface DiffRecord {
  id: string;
  specimenId: string;
  specimenName: string;
  specimenCode: string;
  expectedPosition: Position;
  actualPosition: Position;
  status: DiffStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export type DiffStatus = 'pending' | 'resolved' | 'approved';

export interface AcceptanceRecord {
  id: string;
  specimenId: string;
  specimenName: string;
  specimenCode: string;
  condition: ItemCondition;
  notes?: string;
  acceptedBy: string;
  acceptedAt: string;
  photos?: string[];
}

export type ItemCondition = 'good' | 'damaged' | 'needs-repair';

export interface Cabinet {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  location: string;
  currentVersion?: number;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: string;
  count?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
