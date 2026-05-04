export enum NodeType {
  SUPPLIER = 'supplier',
  MANUFACTURER = 'manufacturer',
  WAREHOUSE = 'warehouse',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  CUSTOMER = 'customer',
}

export enum SimulationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface SupplyNode {
  id: string;
  name: string;
  node_type: NodeType;
  description?: string;
  risk_score: number;
  latitude?: number;
  longitude?: number;
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Dependency {
  id: string;
  source_node_id: string;
  target_node_id: string;
  dependency_strength: number;
  propagation_probability: number;
  lead_time_days?: number;
  volume_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplyChainNetwork {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  node_count: number;
  dependency_count: number;
}

export interface Simulation {
  id: string;
  network_id: string;
  name: string;
  description?: string;
  status: SimulationStatus;
  disrupted_node_ids: string[];
  iterations: number;
  max_propagation_depth: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface NodeRiskResult {
  node_id: string;
  failure_probability: number;
  impact_score: number;
  risk_score: number;
  propagation_paths: string[][];
  earliest_failure_step?: number;
}

export interface SimulationResult {
  id: string;
  simulation_id: string;
  network_id: string;
  node_results: Record<string, NodeRiskResult>;
  overall_risk_score: number;
  most_vulnerable_nodes: string[];
  critical_paths: string[][];
  created_at: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  risk_score: number;
  description?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  result?: NodeRiskResult;
  isDisrupted?: boolean;
  animationStep?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number;
  propagation_prob: number;
  animationStep?: number;
}

export interface NetworkGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CreateNodeData {
  name: string;
  node_type: NodeType;
  description?: string;
  risk_score: number;
  latitude?: number;
  longitude?: number;
  attributes: Record<string, any>;
}

export interface CreateDependencyData {
  source_node_id: string;
  target_node_id: string;
  dependency_strength: number;
  propagation_probability: number;
  lead_time_days?: number;
  volume_percentage?: number;
}

export interface CreateSimulationData {
  network_id: string;
  name: string;
  description?: string;
  disrupted_node_ids: string[];
  iterations: number;
  max_propagation_depth: number;
}

export interface ExcelImportResult {
  nodes_created: number;
  nodes_updated: number;
  dependencies_created: number;
  dependencies_updated: number;
  errors: string[];
}
