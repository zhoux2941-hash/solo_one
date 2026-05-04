import axios from 'axios';
import type {
  SupplyChainNetwork,
  SupplyNode,
  Dependency,
  Simulation,
  SimulationResult,
  CreateNodeData,
  CreateDependencyData,
  CreateSimulationData,
  ExcelImportResult,
  NetworkGraph,
} from '@/types';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TaskStatus {
  task_id: string;
  simulation_id: string;
  network_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    current: number;
    total: number;
    percentage: number;
    message: string;
    details: Record<string, any>;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  has_result: boolean;
}

export interface PaginatedResults {
  items: Array<{
    node_id: string;
    node_name: string;
    failure_probability: number;
    impact_score: number;
    risk_score: number;
    earliest_failure_step?: number;
    propagation_paths: string[][];
  }>;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export const networkApi = {
  getAll: async (): Promise<SupplyChainNetwork[]> => {
    const response = await api.get('/networks/');
    return response.data;
  },

  getById: async (networkId: string): Promise<SupplyChainNetwork> => {
    const response = await api.get(`/networks/${networkId}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }): Promise<SupplyChainNetwork> => {
    const response = await api.post('/networks/', data);
    return response.data;
  },

  getNodes: async (networkId: string): Promise<SupplyNode[]> => {
    const response = await api.get(`/networks/${networkId}/nodes`);
    return response.data;
  },

  createNode: async (networkId: string, data: CreateNodeData): Promise<SupplyNode> => {
    const response = await api.post(`/networks/${networkId}/nodes`, data);
    return response.data;
  },

  getDependencies: async (networkId: string): Promise<Dependency[]> => {
    const response = await api.get(`/networks/${networkId}/dependencies`);
    return response.data;
  },

  createDependency: async (networkId: string, data: CreateDependencyData): Promise<Dependency> => {
    const response = await api.post(`/networks/${networkId}/dependencies`, data);
    return response.data;
  },

  getGraph: async (networkId: string): Promise<NetworkGraph> => {
    const response = await api.get(`/networks/${networkId}/graph`);
    return response.data;
  },
};

export const simulationApi = {
  getAll: async (networkId: string): Promise<Simulation[]> => {
    const response = await api.get(`/simulations/network/${networkId}`);
    return response.data;
  },

  getById: async (simulationId: string): Promise<Simulation> => {
    const response = await api.get(`/simulations/${simulationId}`);
    return response.data;
  },

  create: async (data: CreateSimulationData): Promise<Simulation> => {
    const response = await api.post('/simulations/', data);
    return response.data;
  },

  run: async (simulationId: string): Promise<SimulationResult> => {
    const response = await api.post(`/simulations/${simulationId}/run`);
    return response.data;
  },

  runAsync: async (simulationId: string): Promise<TaskStatus> => {
    const response = await api.post(`/simulations/${simulationId}/async-run`);
    return response.data;
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatus> => {
    const response = await api.get(`/simulations/tasks/${taskId}`);
    return response.data;
  },

  cancelTask: async (taskId: string): Promise<any> => {
    const response = await api.post(`/simulations/tasks/${taskId}/cancel`);
    return response.data;
  },

  getNetworkTasks: async (networkId: string): Promise<TaskStatus[]> => {
    const response = await api.get(`/simulations/tasks/network/${networkId}`);
    return response.data;
  },

  getResult: async (simulationId: string): Promise<SimulationResult> => {
    const response = await api.get(`/simulations/${simulationId}/result`);
    return response.data;
  },

  getPaginatedResults: async (
    simulationId: string,
    page: number = 1,
    pageSize: number = 100,
    minRiskScore?: number
  ): Promise<PaginatedResults> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (minRiskScore !== undefined) {
      params.min_risk_score = minRiskScore;
    }
    
    const response = await api.get(`/simulations/${simulationId}/results/paginated`, { params });
    return response.data;
  },

  compare: async (networkId: string, simulationIds: string[]): Promise<any> => {
    const response = await api.post('/simulations/compare', simulationIds, {
      params: { network_id: networkId },
    });
    return response.data;
  },
};

export const importExportApi = {
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/import-export/template/download', {
      responseType: 'blob',
    });
    return response.data;
  },

  importFromExcel: async (networkId: string, file: File): Promise<ExcelImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/import-export/networks/${networkId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  exportNetwork: async (networkId: string): Promise<any> => {
    const response = await api.get(`/import-export/networks/${networkId}/export`);
    return response.data;
  },
};

export interface OptimizationSuggestion {
  suggestion_type: string;
  target_node_id: string;
  target_node_name: string;
  suggested_action: string;
  risk_reduction_estimate: number;
  cost_estimate: number;
  cost_effectiveness: number;
  description: string;
  details: {
    current_supplier?: string;
    dependency_strength?: number;
    impact_score?: number;
    betweenness_centrality?: number;
    downstream_nodes?: number;
    [key: string]: any;
  };
}

export interface OptimizationSummary {
  total_suggestions: number;
  estimated_total_risk_reduction: number;
  estimated_total_cost: number;
  suggestion_type_breakdown: Record<string, number>;
}

export interface OptimizationResult {
  network_id: string;
  network_name: string;
  node_count: number;
  dependency_count: number;
  suggestions: OptimizationSuggestion[];
  summary: OptimizationSummary;
  filters_applied: {
    max_suggestions: number;
    budget_limit: number | null;
  };
}

export interface SimulatedOptimizationResult {
  network_id: string;
  network_name: string;
  suggestions_applied: OptimizationSuggestion[];
  comparison: {
    original_network: {
      node_count: number;
      link_count: number;
      estimated_aggregate_risk: number;
    };
    optimized_network: {
      node_count: number;
      link_count: number;
      estimated_aggregate_risk: number;
      nodes_added: number;
      links_modified: number;
    };
    risk_analysis: {
      risk_reduction_percentage: number;
      absolute_risk_reduction: number;
      suggestions_applied: number;
    };
    node_risk_comparison: Array<{
      node_id: string;
      node_name: string;
      original_risk: number;
      simulated_risk: number;
    }>;
  };
}

export const optimizationApi = {
  getSuggestions: async (
    networkId: string,
    maxSuggestions: number = 10,
    budgetLimit?: number
  ): Promise<OptimizationResult> => {
    const params: Record<string, any> = { max_suggestions: maxSuggestions };
    if (budgetLimit !== undefined) {
      params.budget_limit = budgetLimit;
    }
    
    const response = await api.get(`/optimization/networks/${networkId}/suggestions`, { params });
    return response.data;
  },

  simulateOptimization: async (
    networkId: string,
    suggestionIndices?: number[]
  ): Promise<SimulatedOptimizationResult> => {
    const params: Record<string, any> = {};
    if (suggestionIndices && suggestionIndices.length > 0) {
      params.suggestion_ids = suggestionIndices;
    }
    
    const response = await api.post(`/optimization/networks/${networkId}/simulate-optimization`, null, { params });
    return response.data;
  },

  compareNetworks: async (
    networkId: string,
    disruptedNodeIds: string[],
    iterations: number = 1000
  ): Promise<any> => {
    const response = await api.post(`/optimization/networks/${networkId}/compare`, null, {
      params: {
        disrupted_node_ids: disruptedNodeIds,
        iterations
      }
    });
    return response.data;
  },

  getSuggestionTypes: async (): Promise<any> => {
    const response = await api.get('/optimization/suggestion-types');
    return response.data;
  },
};

export default api;
