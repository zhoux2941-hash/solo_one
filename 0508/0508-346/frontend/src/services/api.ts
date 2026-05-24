import axios from 'axios';
import { Task, Tugboat, Vessel, Berth, TugboatTimeline, BerthTimeline, ScheduleResult, TaskConflict, HandoverSummary, ScheduleVersion, VersionCompareResult } from '../types';

const api = axios.create({
  baseURL: '/api'
});

export const apiService = {
  getHealth: () => api.get('/health'),
  
  getTugboats: (): Promise<Tugboat[]> => api.get('/tugboats').then(res => res.data),
  getVessels: (): Promise<Vessel[]> => api.get('/vessels').then(res => res.data),
  getBerths: (): Promise<Berth[]> => api.get('/berths').then(res => res.data),
  
  getTasks: (): Promise<Task[]> => api.get('/tasks').then(res => res.data),
  getTask: (id: string): Promise<Task> => api.get(`/tasks/${id}`).then(res => res.data),
  createTask: (task: Partial<Task>): Promise<ScheduleResult> => api.post('/tasks', task).then(res => res.data),
  updateTask: (id: string, updates: Partial<Task>): Promise<ScheduleResult> => api.put(`/tasks/${id}`, updates).then(res => res.data),
  deleteTask: (id: string): Promise<ScheduleResult> => api.delete(`/tasks/${id}`).then(res => res.data),
  
  getTimeline: (): Promise<TugboatTimeline[]> => api.get('/timeline').then(res => res.data),
  getBerthTimeline: (): Promise<BerthTimeline[]> => api.get('/timeline/berth').then(res => res.data),
  reorderTasks: (tugboatId: string, taskOrder: string[]): Promise<ScheduleResult> => 
    api.post(`/reorder/${tugboatId}`, { taskOrder }).then(res => res.data),
  
  getConflicts: (): Promise<TaskConflict[]> => api.get('/conflicts').then(res => res.data),
  generateHandover: (shift: string, operator: string): Promise<HandoverSummary> => 
    api.post('/handover', { shift, operator }).then(res => res.data),

  getVersions: (): Promise<ScheduleVersion[]> => api.get('/versions').then(res => res.data),
  getVersion: (id: string): Promise<ScheduleVersion> => api.get(`/versions/${id}`).then(res => res.data),
  saveVersion: (name: string, createdBy: string, description?: string): Promise<ScheduleVersion> => 
    api.post('/versions', { name, createdBy, description }).then(res => res.data),
  deleteVersion: (id: string): Promise<{ success: boolean }> => api.delete(`/versions/${id}`).then(res => res.data),
  compareVersions: (v1: string, v2: string): Promise<VersionCompareResult> => 
    api.get(`/versions/compare/${v1}/${v2}`).then(res => res.data),
  getVersionTugboatTasks: (versionId: string, tugboatId: string): Promise<Task[]> => 
    api.get(`/versions/${versionId}/tugboat/${tugboatId}`).then(res => res.data)
};
