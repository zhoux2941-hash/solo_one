export interface Node {
  id: string;
  x: number;
  y: number;
  name: string;
  maxHops: number;
  signalRange: number;
  isSource: boolean;
  isTarget: boolean;
  vx?: number;
  vy?: number;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  attenuation: number;
}

export interface PathResult {
  nodes: string[];
  hops: number;
  totalAttenuation: number;
  valid: boolean;
  message?: string;
}

export interface SimulationResult {
  path: string[];
  hops: number;
  totalAttenuation: number;
  success: boolean;
  message: string;
  nodeSignals: Record<string, number>;
}

export interface RoutingEntry {
  targetId: string;
  nextHopId: string | null;
  nextHopName: string;
  cost: number;
  hops: number;
}

export interface RoutingTable {
  nodeId: string;
  entries: RoutingEntry[];
}

export type ToolMode = 'select' | 'addNode' | 'connect' | 'delete' | 'setSource' | 'setTarget';

export interface NetworkState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  hoveredEdgeId: string | null;
  toolMode: ToolMode;
  connectingFromId: string | null;
  simulationResult: SimulationResult | null;
  routingTables: RoutingTable[];
  showCoverage: boolean;
  mousePos: { x: number; y: number } | null;
}

export interface NetworkActions {
  addNode: (x: number, y: number) => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  selectNode: (id: string | null) => void;
  setHoveredEdge: (id: string | null) => void;
  setToolMode: (mode: ToolMode) => void;
  startConnection: (id: string) => void;
  endConnection: (id: string) => void;
  cancelConnection: () => void;
  addEdge: (sourceId: string, targetId: string) => void;
  deleteEdge: (edgeId: string) => void;
  runSimulation: () => void;
  clearSimulation: () => void;
  setSourceNode: (id: string) => void;
  setTargetNode: (id: string) => void;
  toggleCoverage: () => void;
  autoLayout: () => void;
  clearAll: () => void;
  setMousePos: (pos: { x: number; y: number } | null) => void;
  calculateRoutingTables: () => void;
  clearRoutingTables: () => void;
}
