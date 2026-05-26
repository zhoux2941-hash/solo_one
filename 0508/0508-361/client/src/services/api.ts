import axios from 'axios';
import {
  User,
  Paper,
  ReviewTask,
  Review,
  MatchedReviewer,
  ReviewerWithStats,
  Statistics,
  EmailLog,
  Recommendation,
  FinalDecision
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    affiliation?: string;
    researchKeywords?: string[];
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getCurrentUser: () => api.get<User>('/auth/me'),

  updateProfile: (data: {
    name?: string;
    affiliation?: string;
    researchKeywords?: string[];
  }) => api.put<User>('/auth/profile', data)
};

export const paperAPI = {
  submit: (formData: FormData) =>
    api.post('/papers/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getMyPapers: () => api.get<Paper[]>('/papers/my'),

  getPaper: (id: number) => api.get<Paper>(`/papers/${id}`),

  downloadPaper: (filename: string) =>
    api.get(`/papers/download/${filename}`, { responseType: 'blob' })
};

export const reviewAPI = {
  getMyReviews: () => api.get<ReviewTask[]>('/reviews/my'),

  getReview: (id: number) => api.get<ReviewTask>(`/reviews/${id}`),

  submitReview: (
    reviewId: number,
    data: {
      rating: number;
      comment: string;
      recommendation: Recommendation;
    }
  ) => api.put<Review>(`/reviews/${reviewId}`, data)
};

export const chairAPI = {
  getAllPapers: () => api.get<Paper[]>('/chair/papers'),

  getReviewers: () => api.get<ReviewerWithStats[]>('/chair/reviewers'),

  matchReviewers: (paperId: number) =>
    api.get<{
      paperId: number;
      paperTitle: string;
      paperKeywords: string[];
      matchedReviewers: MatchedReviewer[];
    }>(`/chair/match-reviewers/${paperId}`),

  autoAssignReviewers: (paperId: number, minCount?: number, maxCount?: number) =>
    api.post(`/chair/auto-assign-reviewers/${paperId}`, { minCount, maxCount }),

  assignReviewer: (paperId: number, reviewerIds: number[]) =>
    api.post('/chair/assign-reviewer', { paperId, reviewerIds }),

  setDecision: (
    paperId: number,
    decision: FinalDecision,
    summary?: string
  ) =>
    api.post(`/chair/set-decision/${paperId}`, { decision, summary }),

  sendEmails: (paperIds?: number[]) =>
    api.post('/chair/send-emails', { paperIds }),

  getEmailLogs: () => api.get<EmailLog[]>('/chair/email-logs'),

  getStatistics: () => api.get<Statistics>('/chair/statistics')
};

export default api;
