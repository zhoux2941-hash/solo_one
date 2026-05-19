import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const musicApi = {
  getMusics: (page, size, keyword) => api.get('/musics/public/list', { params: { page, size, keyword } }),
  getMusic: (id) => api.get(`/musics/public/${id}`),
  getHotMusics: (limit) => api.get('/musics/public/hot', { params: { limit } }),
  getMyUploads: () => api.get('/musics/my-uploads'),
  uploadMusic: (formData) => api.post('/musics/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPendingMusics: (page, size) => api.get('/musics/admin/pending', { params: { page, size } }),
  approveMusic: (id) => api.post(`/musics/admin/${id}/approve`),
  rejectMusic: (id) => api.post(`/musics/admin/${id}/reject`),
};

export const playlistApi = {
  getMyPlaylists: () => api.get('/playlists/my'),
  getPublicPlaylists: () => api.get('/playlists/public'),
  createPlaylist: (data) => api.post('/playlists', null, { params: data }),
  getPlaylistMusics: (id) => api.get(`/playlists/${id}/musics`),
  addMusicToPlaylist: (playlistId, musicId) => api.post(`/playlists/${playlistId}/musics/${musicId}`),
  removeMusicFromPlaylist: (playlistId, musicId) => api.delete(`/playlists/${playlistId}/musics/${musicId}`),
};

export const commentApi = {
  getMusicComments: (musicId) => api.get(`/comments/music/${musicId}`),
  createComment: (data) => api.post('/comments', null, { params: data }),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  getPlayHistory: (limit) => api.get('/users/history', { params: { limit } }),
  updateProfile: (data) => api.put('/users/profile', null, { params: data }),
};

export const shareApi = {
  createShare: (data) => api.post('/shares', null, { params: data }),
  getShare: (code) => api.get(`/shares/${code}`),
};

export default api;
