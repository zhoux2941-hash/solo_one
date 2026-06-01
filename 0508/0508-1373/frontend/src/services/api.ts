import axios from 'axios';
import type {
  LoadTest,
  LoadTestConfig,
  TestResult,
  ABTestConfig,
  ABTestResult,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

export const testAPI = {
  create: (config: LoadTestConfig) =>
    api.post<LoadTest>('/tests', config).then((res) => res.data),

  list: () => api.get<LoadTest[]>('/tests').then((res) => res.data),

  get: (id: string) =>
    api.get<LoadTest>(`/tests/${id}`).then((res) => res.data),

  stop: (id: string) =>
    api.post(`/tests/${id}/stop`).then((res) => res.data),

  scale: (id: string, workerCount: number) =>
    api.post(`/tests/${id}/scale`, { worker_count: workerCount }).then((res) => res.data),

  getResult: (id: string) =>
    api.get<TestResult>(`/tests/${id}/result`).then((res) => res.data),

  generateReport: (id: string) =>
    api.post<{ report_path: string }>(`/tests/${id}/report`).then((res) => res.data),
};

export const abTestAPI = {
  create: (config: ABTestConfig) =>
    api.post<ABTestResult>('/ab-tests', config).then((res) => res.data),

  get: (id: string) =>
    api.get<ABTestResult>(`/ab-tests/${id}`).then((res) => res.data),

  generateReport: (id: string) =>
    api.post<{ report_path: string }>(`/ab-tests/${id}/report`).then((res) => res.data),
};

export default api;
