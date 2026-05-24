import {
  RadiationSourceApplication,
  ApplicationCreate,
  ApplicationUpdate,
  Room,
  Escort,
  ConflictResult,
  DailyReport,
} from '../../shared/types';

const API_BASE = '/api';

class ApiError extends Error {
  conflict?: any;
  constructor(message: string, conflict?: any) {
    super(message);
    this.conflict = conflict;
  }
}

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
    throw new ApiError(errorData.error || '请求失败', errorData.conflict);
  }

  return response.json();
}

export const applicationApi = {
  getAll: () => request<RadiationSourceApplication[]>('/applications'),
  create: (data: ApplicationCreate) =>
    request<RadiationSourceApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: ApplicationUpdate) =>
    request<RadiationSourceApplication>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/applications/${id}`, {
      method: 'DELETE',
    }),
  approve: (id: string) =>
    request<RadiationSourceApplication>(`/applications/${id}/approve`, {
      method: 'POST',
    }),
  reject: (id: string, reason: string) =>
    request<RadiationSourceApplication>(`/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const conflictApi = {
  check: (data: {
    startTime: string;
    endTime: string;
    roomId: string;
    escorts: string[];
    excludeId?: string;
  }) =>
    request<ConflictResult>('/conflicts/check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const roomApi = {
  getAll: () => request<Room[]>('/rooms'),
};

export const escortApi = {
  getAll: () => request<Escort[]>('/escorts'),
};

export const reportApi = {
  getDaily: (date?: string) =>
    request<DailyReport>(`/reports/daily${date ? `?date=${date}` : ''}`),
};
