import { create } from 'zustand';
import { Schedule, WorkPoint, Team, Conflict, Handover } from '../types';
import { mockSchedules, mockWorkPoints, mockTeams, mockHandovers } from '../data/mockData';
import { detectConflicts } from '../utils/conflictDetector';
import { format } from 'date-fns';

export interface ScheduleVersion {
  id: string;
  scheduleId: string;
  snapshot: Schedule;
  timestamp: Date;
  operator: string;
  changeType: 'create' | 'update' | 'delete';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface ScheduleState {
  schedules: Schedule[];
  workPoints: WorkPoint[];
  teams: Team[];
  conflicts: Conflict[];
  handovers: Handover[];
  versions: ScheduleVersion[];
  selectedSchedule: Schedule | null;
  selectedWorkPoint: WorkPoint | null;
  selectedVersionId: string | null;
  isDragging: boolean;
  dragScheduleId: string | null;
  setSchedules: (schedules: Schedule[]) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  addSchedule: (schedule: Schedule) => void;
  deleteSchedule: (id: string) => void;
  selectSchedule: (schedule: Schedule | null) => void;
  selectWorkPoint: (workPoint: WorkPoint | null) => void;
  selectVersion: (versionId: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;
  setDragScheduleId: (id: string | null) => void;
  recalculateConflicts: () => void;
  addHandover: (handover: Handover) => void;
  updateHandover: (id: string, updates: Partial<Handover>) => void;
  getVersionsBySchedule: (scheduleId: string) => ScheduleVersion[];
  getVersionsByDateRange: (startDate: Date, endDate: Date) => ScheduleVersion[];
  compareVersions: (version1Id: string, version2Id: string) => {
    schedule1: Schedule;
    schedule2: Schedule;
    differences: { field: string; oldValue: any; newValue: any }[];
  } | null;
}

function compareSchedules(oldSchedule: Schedule, newSchedule: Schedule) {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const fields: (keyof Schedule)[] = ['startTime', 'endTime', 'status', 'title', 'description', 'teamId'];
  
  fields.forEach(field => {
    const oldVal = oldSchedule[field];
    const newVal = newSchedule[field];
    if (oldVal !== newVal) {
      changes.push({
        field: field as string,
        oldValue: oldVal instanceof Date ? format(oldVal, 'yyyy-MM-dd HH:mm:ss') : oldVal,
        newValue: newVal instanceof Date ? format(newVal, 'yyyy-MM-dd HH:mm:ss') : newVal
      });
    }
  });
  
  return changes;
}

function generateVersionId() {
  return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: mockSchedules,
  workPoints: mockWorkPoints,
  teams: mockTeams,
  conflicts: detectConflicts(mockSchedules),
  handovers: mockHandovers,
  versions: mockSchedules.map(s => ({
    id: generateVersionId(),
    scheduleId: s.id,
    snapshot: { ...s },
    timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
    operator: '系统初始化',
    changeType: 'create' as const,
    changes: []
  })),
  selectedSchedule: null,
  selectedWorkPoint: null,
  selectedVersionId: null,
  isDragging: false,
  dragScheduleId: null,

  setSchedules: (schedules) => set({ schedules, conflicts: detectConflicts(schedules) }),

  updateSchedule: (id, updates) => set((state) => {
    const oldSchedule = state.schedules.find(s => s.id === id);
    let newSchedules = state.schedules.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );

    const updatedSchedule = newSchedules.find(s => s.id === id);
    if (updatedSchedule && (updates.startTime || updates.endTime)) {
      const updatedWorkPoint = state.workPoints.find(wp => wp.id === updatedSchedule.workpointId);
      
      if (updatedWorkPoint && updatedSchedule.type === 'team-entry') {
        const adjacentWorkPoints = state.workPoints.filter(wp => 
          wp.line === updatedWorkPoint.line && 
          Math.abs(wp.position - updatedWorkPoint.position) === 1
        );

        adjacentWorkPoints.forEach(adjWp => {
          const adjSchedules = newSchedules.filter(s => 
            s.workpointId === adjWp.id && 
            s.type === 'team-entry' &&
            s.id !== id
          );

          adjSchedules.forEach(adjSch => {
            const adjStart = new Date(adjSch.startTime).getTime();
            const updatedEnd = new Date(updatedSchedule.endTime).getTime();

            if (adjStart < updatedEnd && adjStart >= new Date(updatedSchedule.startTime).getTime()) {
              const duration = new Date(adjSch.endTime).getTime() - new Date(adjSch.startTime).getTime();
              const newStart = new Date(updatedEnd);
              const newEnd = new Date(updatedEnd + duration);

              newSchedules = newSchedules.map(s => 
                s.id === adjSch.id ? {
                  ...s,
                  startTime: newStart,
                  endTime: newEnd
                } : s
              );
            }
          });
        });
      }
    }

    let newVersions = state.versions;
    if (oldSchedule && updatedSchedule) {
      const changes = compareSchedules(oldSchedule, updatedSchedule);
      if (changes.length > 0) {
        const newVersion: ScheduleVersion = {
          id: generateVersionId(),
          scheduleId: id,
          snapshot: { ...updatedSchedule },
          timestamp: new Date(),
          operator: '调度员',
          changeType: 'update',
          changes
        };
        newVersions = [...state.versions, newVersion];
      }
    }

    return {
      schedules: newSchedules,
      conflicts: detectConflicts(newSchedules),
      versions: newVersions
    };
  }),

  addSchedule: (schedule) => set((state) => {
    const newSchedules = [...state.schedules, schedule];
    const newVersion: ScheduleVersion = {
      id: generateVersionId(),
      scheduleId: schedule.id,
      snapshot: { ...schedule },
      timestamp: new Date(),
      operator: '调度员',
      changeType: 'create',
      changes: []
    };
    return {
      schedules: newSchedules,
      conflicts: detectConflicts(newSchedules),
      versions: [...state.versions, newVersion]
    };
  }),

  deleteSchedule: (id) => set((state) => {
    const deletedSchedule = state.schedules.find(s => s.id === id);
    const newSchedules = state.schedules.filter(s => s.id !== id);
    
    let newVersions = state.versions;
    if (deletedSchedule) {
      const newVersion: ScheduleVersion = {
        id: generateVersionId(),
        scheduleId: id,
        snapshot: { ...deletedSchedule },
        timestamp: new Date(),
        operator: '调度员',
        changeType: 'delete',
        changes: []
      };
      newVersions = [...state.versions, newVersion];
    }

    return {
      schedules: newSchedules,
      conflicts: detectConflicts(newSchedules),
      versions: newVersions
    };
  }),

  selectSchedule: (schedule) => set({ selectedSchedule: schedule, selectedVersionId: null }),
  selectWorkPoint: (workPoint) => set({ selectedWorkPoint: workPoint }),
  selectVersion: (versionId) => set({ selectedVersionId: versionId }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setDragScheduleId: (dragScheduleId) => set({ dragScheduleId }),

  recalculateConflicts: () => set((state) => ({
    conflicts: detectConflicts(state.schedules)
  })),

  addHandover: (handover) => set((state) => ({
    handovers: [...state.handovers, handover]
  })),

  updateHandover: (id, updates) => set((state) => ({
    handovers: state.handovers.map(h =>
      h.id === id ? { ...h, ...updates } : h
    )
  })),

  getVersionsBySchedule: (scheduleId) => {
    return get().versions
      .filter(v => v.scheduleId === scheduleId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getVersionsByDateRange: (startDate, endDate) => {
    return get().versions
      .filter(v => {
        const timestamp = new Date(v.timestamp).getTime();
        return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  compareVersions: (version1Id, version2Id) => {
    const version1 = get().versions.find(v => v.id === version1Id);
    const version2 = get().versions.find(v => v.id === version2Id);
    
    if (!version1 || !version2) return null;
    
    const differences = compareSchedules(version1.snapshot, version2.snapshot);
    
    return {
      schedule1: version1.snapshot,
      schedule2: version2.snapshot,
      differences
    };
  }
}));
