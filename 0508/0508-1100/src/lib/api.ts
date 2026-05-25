const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    try {
      const err = await res.json() as ApiResponse<T>;
      throw new Error(err.error || `API error: ${res.status}`);
    } catch {
      throw new Error(`API error: ${res.status}`);
    }
  }
  const json = await res.json() as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}

export const api = {
  getScores: () => request<any[]>('/scores'),
  getScore: (id: string) => request<any>(`/scores/${id}`),
  getVersions: (scoreId: string) => request<any[]>(`/scores/${scoreId}/versions`),
  getAnnotations: (scoreId: string, versionId?: string) =>
    request<any[]>(`/scores/${scoreId}/annotations${versionId ? `?versionId=${versionId}` : ''}`),
  getConflicts: (scoreId: string) => request<any[]>(`/scores/${scoreId}/conflicts`),
  getMissing: (scoreId: string) => request<any[]>(`/scores/${scoreId}/missing`),
  finalizeVersion: (scoreId: string, versionId: string) =>
    request<any>(`/scores/${scoreId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    }),
  createExport: (config: any) =>
    request<any>('/export/proof', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  downloadExport: (exportId: string) => `${API_BASE}/export/${exportId}/download`,

  getTeachers: () => request<any[]>('/teachers'),
  getTeacher: (teacherId: string) => request<any>(`/teachers/${teacherId}`),
  getTeacherScores: (teacherId: string) => request<any[]>(`/teachers/${teacherId}/scores`),
  getTeacherAnnotations: (teacherId: string, scoreId?: string) =>
    request<any[]>(`/teachers/${teacherId}/annotations${scoreId ? `?scoreId=${scoreId}` : ''}`),
  getTeacherConflicts: (teacherId: string) => request<any[]>(`/teachers/${teacherId}/conflicts`),
  exportTeacherProof: (teacherId: string) =>
    request<any>(`/teachers/${teacherId}/export`, {
      method: 'POST',
    }),
  compareTeachers: (teacherIds: string[]) =>
    request<any>(`/teachers/compare?teacherIds=${teacherIds.join(',')}`),
};
