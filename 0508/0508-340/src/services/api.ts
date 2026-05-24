import type {
  Buoy,
  CorrectionTask,
  TrackPoint,
  DataGap,
  VerificationRecord,
  ExportSummary,
  SeaArea,
  TaskStatus,
  GapStatus
} from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const taskApi = {
  uploadTelemetry: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`${API_BASE}/telemetry/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  createMockData: async (buoyCode: string, days?: number) => {
    return request('/telemetry/mock', {
      method: 'POST',
      body: JSON.stringify({ buoyCode, days }),
    });
  },

  getTasks: async (status?: TaskStatus, buoyId?: string, seaArea?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (buoyId) params.set('buoyId', buoyId);
    if (seaArea) params.set('seaArea', seaArea);
    return request<CorrectionTask[]>(`/tasks?${params.toString()}`);
  },

  getTaskById: async (id: string) => {
    return request<CorrectionTask>(`/tasks/${id}`);
  },

  getTaskStats: async () => {
    return request<{ pending: number; processing: number; completed: number; failed: number }>('/tasks/stats');
  },
};

export const buoyApi = {
  getAll: async (seaArea?: string) => {
    const params = new URLSearchParams();
    if (seaArea) params.set('seaArea', seaArea);
    return request<Buoy[]>(`/buoys?${params.toString()}`);
  },

  getById: async (id: string) => {
    return request<Buoy>(`/buoys/${id}`);
  },

  getTrack: async (id: string, source?: 'telemetry' | 'backfill') => {
    const params = new URLSearchParams();
    if (source) params.set('source', source);
    return request<{ buoy: Buoy; trackPoints: TrackPoint[] }>(`/buoys/${id}/track?${params.toString()}`);
  },

  getGaps: async (id: string, status?: GapStatus) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    return request<DataGap[]>(`/buoys/${id}/gaps?${params.toString()}`);
  },

  getDriftStatistics: async (id: string) => {
    return request<{ maxDrift: number; avgDrift: number; totalCorrections: number }>(
      `/buoys/${id}/drift-statistics`
    );
  },

  getAnchorComparison: async (id: string) => {
    return request<Array<{ timestamp: string; originalDistance: number; correctedDistance?: number }>>(
      `/buoys/${id}/anchor-comparison`
    );
  },

  getSeaAreas: async () => {
    return request<SeaArea[]>('/buoys/sea-areas');
  },

  uploadBackfill: async (buoyId: string, gapId: string, file: File, uploadedBy: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('gapId', gapId);
    formData.append('uploadedBy', uploadedBy);
    
    const response = await fetch(`${API_BASE}/buoys/${buoyId}/backfill`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
};

export const verificationApi = {
  confirm: async (gapId: string, verifiedBy: string, comment?: string) => {
    return request(`/verification/${gapId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ verifiedBy, comment }),
    });
  },

  reject: async (gapId: string, verifiedBy: string, comment?: string) => {
    return request(`/verification/${gapId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ verifiedBy, comment }),
    });
  },

  getHistory: async (gapId: string) => {
    return request<VerificationRecord[]>(`/verification/${gapId}/history`);
  },
};

export const exportApi = {
  exportSummary: (id: string, format: 'json' | 'csv' = 'json', exportedBy?: string) => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (exportedBy) params.set('exportedBy', exportedBy);
    window.open(`${API_BASE}/export/${id}/summary?${params.toString()}`, '_blank');
  },

  exportBatchSummary: (buoyCodes: string[], format: 'json' | 'csv' = 'json', exportedBy?: string) => {
    const params = new URLSearchParams();
    params.set('format', format);
    params.set('buoyCodes', buoyCodes.join(','));
    if (exportedBy) params.set('exportedBy', exportedBy);
    window.open(`${API_BASE}/export/batch/summary?${params.toString()}`, '_blank');
  },

  exportTrack: (id: string) => {
    window.open(`${API_BASE}/export/${id}/track`, '_blank');
  },

  getPreview: async (id: string, exportedBy?: string) => {
    const params = new URLSearchParams();
    if (exportedBy) params.set('exportedBy', exportedBy);
    return request<ExportSummary>(`/export/${id}/preview?${params.toString()}`);
  },
};
