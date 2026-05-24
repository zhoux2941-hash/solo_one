export enum TaskPhase {
  DEPART = 'depart',
  APPROACH = 'approach',
  BERTH = 'berth',
  UNBERTH = 'unberth',
  RETURN = 'return'
}

export enum TaskType {
  BERTHING = 'berthing',
  UNBERTHING = 'unberthing'
}

export enum TugboatStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  MAINTENANCE = 'maintenance'
}

export enum ConflictLevel {
  NONE = 'none',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface Tugboat {
  id: string;
  name: string;
  status: TugboatStatus;
  power: number;
  currentLocation: string;
}

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  length: number;
  grossTonnage: number;
}

export interface Berth {
  id: string;
  name: string;
  code: string;
  maxLength: number;
}

export interface Task {
  id: string;
  tugboatId: string;
  vesselId: string;
  berthId: string;
  type: TaskType;
  phase: TaskPhase;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  priority: number;
  notes?: string;
}

export interface TaskConflict {
  taskId: string;
  conflictTaskId: string;
  level: ConflictLevel;
  message: string;
  type: 'overlap' | 'sequence' | 'resource';
}

export interface ScheduleResult {
  tasks: Task[];
  conflicts: TaskConflict[];
  affectedTaskIds: string[];
}

export interface TugboatTimeline {
  tugboatId: string;
  tugboatName: string;
  tasks: Task[];
}

export interface BerthTimeline {
  berthId: string;
  berthName: string;
  berthCode: string;
  tasks: Task[];
}

export interface ScheduleVersion {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  tasks: Task[];
}

export interface TaskDiff {
  taskId: string;
  type: 'added' | 'removed' | 'modified';
  field?: string;
  oldValue?: any;
  newValue?: any;
  vesselId: string;
  tugboatId: string;
}

export interface VersionCompareResult {
  version1Id: string;
  version2Id: string;
  version1Name: string;
  version2Name: string;
  addedTasks: Task[];
  removedTasks: Task[];
  modifiedTasks: TaskDiff[];
  sameTasks: Task[];
}

export type GroupMode = 'tugboat' | 'berth';

export interface HandoverSummary {
  id: string;
  generatedAt: string;
  shift: string;
  operator: string;
  completedTasks: string[];
  ongoingTasks: string[];
  pendingTasks: string[];
  conflicts: TaskConflict[];
  notes: string;
  tugboatStatuses: { tugboatId: string; tugboatName: string; status: string; currentTask?: string }[];
}
