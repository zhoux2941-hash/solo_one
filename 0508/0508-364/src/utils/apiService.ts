import { MockApiConfig, HttpMethod, RequestLog } from '../types';

const API_BASE = 'http://localhost:3001/api';

export interface CreateMockApiRequest {
  name: string;
  method: HttpMethod;
  path: string;
  delay: number;
  statusCode: number;
  responseData: any;
}

export interface UpdateMockApiRequest {
  name?: string;
  method?: HttpMethod;
  path?: string;
  delay?: number;
  statusCode?: number;
  responseData?: any;
  isEnabled?: boolean;
}

export async function fetchMockApis(): Promise<MockApiConfig[]> {
  const response = await fetch(`${API_BASE}/mock-apis`);
  const data = await response.json();
  return data.data;
}

export async function createMockApi(payload: CreateMockApiRequest): Promise<MockApiConfig> {
  const response = await fetch(`${API_BASE}/mock-apis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.data;
}

export async function updateMockApi(id: string, payload: UpdateMockApiRequest): Promise<MockApiConfig> {
  const response = await fetch(`${API_BASE}/mock-apis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.data;
}

export async function deleteMockApi(id: string): Promise<MockApiConfig> {
  const response = await fetch(`${API_BASE}/mock-apis/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  return data.data;
}

export async function toggleMockApi(id: string): Promise<MockApiConfig> {
  const response = await fetch(`${API_BASE}/mock-apis/${id}/toggle`, {
    method: 'POST',
  });
  const data = await response.json();
  return data.data;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { timeout: 2000 });
    return response.ok;
  } catch {
    return false;
  }
}

export function getMockApiUrl(path: string, method: HttpMethod): string {
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return `http://localhost:3001/mock${normalizedPath}`;
}

export async function fetchRequestLogs(): Promise<RequestLog[]> {
  const response = await fetch(`${API_BASE}/logs`);
  const data = await response.json();
  return data.data;
}

export async function clearRequestLogs(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/logs`, {
    method: 'DELETE',
  });
  return response.ok;
}
