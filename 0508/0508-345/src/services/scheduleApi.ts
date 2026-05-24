import {
  ConflictRollbackRecord,
  ConflictAnalysis,
  ScheduleViewData,
} from '../../shared/types';

const API_BASE = '/api/schedule';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '请求失败');
  }

  return response.json();
}

export const scheduleApi = {
  getView: (type: 'room' | 'escort', date?: string) =>
    request<ScheduleViewData>(`/view?type=${type}${date ? `&date=${date}` : ''}`),
  
  getRecentConflicts: (days: number = 3) =>
    request<ConflictRollbackRecord[]>(`/conflicts/recent?days=${days}`),
  
  getConflictAnalysis: (days: number = 3) =>
    request<ConflictAnalysis>(`/conflicts/analysis?days=${days}`),
  
  resolveConflict: (id: string, resolution: string) =>
    request<ConflictRollbackRecord>(`/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    }),
};
