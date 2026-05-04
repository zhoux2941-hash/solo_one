import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    const message = error.response?.data?.error?.message || 
                    error.response?.data?.error || 
                    '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

export const simulationApi = {
  create: async (config) => {
    const response = await api.post('/simulations/create', config);
    return response.data;
  },

  list: async (status = 'all') => {
    const response = await api.get(`/simulations/list?status=${status}`);
    return response.data;
  },

  get: async (simulationId) => {
    const response = await api.get(`/simulations/${simulationId}`);
    return response.data;
  },

  start: async (simulationId) => {
    const response = await api.post(`/simulations/${simulationId}/start`);
    return response.data;
  },

  delete: async (simulationId) => {
    const response = await api.delete(`/simulations/${simulationId}`);
    return response.data;
  },

  getStatus: async (simulationId) => {
    const response = await api.get(`/simulations/${simulationId}/status`);
    return response.data;
  }
};

export const resultApi = {
  getTrajectory: async (simulationId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/results/${simulationId}/trajectory?${queryString}`
      : `/results/${simulationId}/trajectory`;
    const response = await api.get(url);
    return response.data;
  },

  getTrajectoryAtTime: async (simulationId, time) => {
    const response = await api.get(`/results/${simulationId}/trajectory/${time}`);
    return response.data;
  },

  getSnapshotList: async (simulationId) => {
    const response = await api.get(`/results/${simulationId}/snapshots`);
    return response.data;
  },

  getSnapshot: async (simulationId, index) => {
    const response = await api.get(`/results/${simulationId}/snapshots/${index}`);
    return response.data;
  },

  getHeatmap: async (simulationId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/results/${simulationId}/heatmap?${queryString}`
      : `/results/${simulationId}/heatmap`;
    const response = await api.get(url);
    return response.data;
  },

  getStatistics: async (simulationId) => {
    const response = await api.get(`/results/${simulationId}/statistics`);
    return response.data;
  }
};

export const optimizationApi = {
  optimizeIntersection: async (config) => {
    const response = await api.post('/optimization/intersection', config);
    return response.data;
  },

  start: async (config) => {
    const response = await api.post('/optimization/start', config);
    return response.data;
  },

  getStatus: async (optimizationId) => {
    const response = await api.get(`/optimization/${optimizationId}/status`);
    return response.data;
  },

  getResult: async (optimizationId) => {
    const response = await api.get(`/optimization/${optimizationId}/result`);
    return response.data;
  }
};

export const realtimeApi = {
  injectSensorData: async (simulationId, sensorData) => {
    const response = await api.post(`/realtime/${simulationId}/sensor`, sensorData);
    return response.data;
  },

  injectBatchSensorData: async (simulationId, sensorDataArray) => {
    const response = await api.post(`/realtime/${simulationId}/sensor/batch`, {
      data: sensorDataArray
    });
    return response.data;
  },

  getRealtimeState: async (simulationId) => {
    const response = await api.get(`/realtime/${simulationId}/state`);
    return response.data;
  },

  getDetectorData: async (simulationId, edgeId) => {
    const response = await api.get(`/realtime/${simulationId}/detector/${edgeId}`);
    return response.data;
  },

  startDataGenerator: async (simulationId, options = {}) => {
    const response = await api.post(`/realtime/${simulationId}/generator/start`, options);
    return response.data;
  },

  stopDataGenerator: async (simulationId) => {
    const response = await api.post(`/realtime/${simulationId}/generator/stop`);
    return response.data;
  },

  createDigitalTwin: async (config) => {
    const response = await api.post('/twin/create', config);
    return response.data;
  },

  startDigitalTwin: async (config) => {
    const response = await api.post('/twin/start', config);
    return response.data;
  },

  getTwinState: async (twinId) => {
    const response = await api.get(`/twin/${twinId}/state`);
    return response.data;
  },

  pauseDigitalTwin: async (twinId) => {
    const response = await api.post(`/twin/${twinId}/pause`);
    return response.data;
  },

  resumeDigitalTwin: async (twinId) => {
    const response = await api.post(`/twin/${twinId}/resume`);
    return response.data;
  },

  stopDigitalTwin: async (twinId) => {
    const response = await api.post(`/twin/${twinId}/stop`);
    return response.data;
  },

  setControlStrategy: async (twinId, intersectionId, strategy) => {
    const response = await api.post(`/twin/${twinId}/strategy`, {
      intersectionId,
      strategy
    });
    return response.data;
  },

  setTwinMode: async (twinId, mode) => {
    const response = await api.post(`/twin/${twinId}/mode`, { mode });
    return response.data;
  },

  exportTwinData: async (twinId, options = {}) => {
    const response = await api.post(`/twin/${twinId}/export`, options);
    return response.data;
  },

  getAllTwins: async () => {
    const response = await api.get('/twin/list');
    return response.data;
  },

  getActiveSimulations: async () => {
    const response = await api.get('/realtime/active');
    return response.data;
  }
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
