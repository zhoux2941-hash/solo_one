export type ScheduleType = 'power-off' | 'sensor-replace' | 'team-entry' | 'recovery';

export type ScheduleStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type WorkPointStatus = 'normal' | 'maintenance' | 'offline';

export type ConflictType = 'time-overlap' | 'resource-conflict' | 'safety-violation';

export type ConflictSeverity = 'warning' | 'critical';

export type HandoverStatus = 'draft' | 'submitted' | 'confirmed';

export interface WorkPoint {
  id: string;
  name: string;
  line: string;
  position: number;
  status: WorkPointStatus;
}

export interface Schedule {
  id: string;
  workpointId: string;
  type: ScheduleType;
  startTime: Date;
  endTime: Date;
  teamId?: string;
  status: ScheduleStatus;
  title: string;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  leader: string;
  members: string[];
  shift: 'day' | 'night';
}

export interface Conflict {
  id: string;
  scheduleId1: string;
  scheduleId2: string;
  type: ConflictType;
  description: string;
  severity: ConflictSeverity;
}

export interface HandoverTask {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export interface Handover {
  id: string;
  shiftDate: Date;
  fromTeam: string;
  toTeam: string;
  content: string;
  tasks: HandoverTask[];
  status: HandoverStatus;
  createdAt: Date;
}
