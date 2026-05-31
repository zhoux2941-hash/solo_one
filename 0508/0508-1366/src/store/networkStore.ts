import { create } from 'zustand';
import { Node, Edge, ToolMode, NetworkState, NetworkActions, SimulationResult, RoutingTable } from '../types/network';
import { generateId, calculateDistance, calculateAttenuation, findPathBFS, forceDirectedLayout, calculateAllRoutingTables } from '../utils/network';

let nodeCounter = 1;

export const useNetworkStore = create<NetworkState & NetworkActions>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  hoveredEdgeId: null,
  toolMode: 'select',
  connectingFromId: null,
  simulationResult: null,
  routingTables: [],
  showCoverage: false,
  mousePos: null,

  addNode: (x: number, y: number) => {
    const newNode: Node = {
      id: generateId(),
      x,
      y,
      name: `路由器${nodeCounter++}`,
      maxHops: 5,
      signalRange: 150,
      isSource: false,
      isTarget: false,
    };
    set(state => ({ nodes: [...state.nodes, newNode], routingTables: [] }));
  },

  deleteNode: (id: string) => {
    const nodeToDelete = get().nodes.find(n => n.id === id);
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id).map(n => ({
        ...n,
        isSource: nodeToDelete?.isSource ? false : n.isSource,
        isTarget: nodeToDelete?.isTarget ? false : n.isTarget,
      })),
      edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      simulationResult: null,
      routingTables: [],
    }));
  },

  updateNode: (id: string, updates: Partial<Node>) => {
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
      simulationResult: null,
      routingTables: [],
    }));
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  setHoveredEdge: (id: string | null) => {
    set({ hoveredEdgeId: id });
  },

  setToolMode: (mode: ToolMode) => {
    set({ toolMode: mode, connectingFromId: null, hoveredEdgeId: null });
  },

  startConnection: (id: string) => {
    set({ connectingFromId: id });
  },

  endConnection: (id: string) => {
    const { connectingFromId, addEdge } = get();
    if (connectingFromId && connectingFromId !== id) {
      addEdge(connectingFromId, id);
    }
    set({ connectingFromId: null });
  },

  cancelConnection: () => {
    set({ connectingFromId: null });
  },

  addEdge: (sourceId: string, targetId: string) => {
    const { nodes, edges } = get();
    const exists = edges.some(
      e => (e.sourceId === sourceId && e.targetId === targetId) ||
           (e.sourceId === targetId && e.targetId === sourceId)
    );
    if (exists) return;

    const source = nodes.find(n => n.id === sourceId);
    const target = nodes.find(n => n.id === targetId);
    if (!source || !target) return;

    const distance = calculateDistance(source.x, source.y, target.x, target.y);
    const attenuation = calculateAttenuation(distance);

    const newEdge: Edge = {
      id: generateId(),
      sourceId,
      targetId,
      attenuation,
    };
    set(state => ({ edges: [...state.edges, newEdge], simulationResult: null, routingTables: [] }));
  },

  deleteEdge: (edgeId: string) => {
    set(state => ({
      edges: state.edges.filter(e => e.id !== edgeId),
      hoveredEdgeId: state.hoveredEdgeId === edgeId ? null : state.hoveredEdgeId,
      simulationResult: null,
      routingTables: [],
    }));
  },

  runSimulation: () => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find(n => n.isSource);
    const targetNode = nodes.find(n => n.isTarget);

    if (!sourceNode || !targetNode) {
      set({
        simulationResult: {
          path: [],
          hops: 0,
          totalAttenuation: 0,
          success: false,
          message: '请先设置源节点和目标节点',
          nodeSignals: {},
        }
      });
      return;
    }

    const result = findPathBFS(nodes, edges, sourceNode.id, targetNode.id);
    if (result) {
      set({ simulationResult: result });
    }
  },

  clearSimulation: () => {
    set({ simulationResult: null });
  },

  setSourceNode: (id: string) => {
    set(state => ({
      nodes: state.nodes.map(n => ({
        ...n,
        isSource: n.id === id,
      })),
      simulationResult: null,
    }));
  },

  setTargetNode: (id: string) => {
    set(state => ({
      nodes: state.nodes.map(n => ({
        ...n,
        isTarget: n.id === id,
      })),
      simulationResult: null,
    }));
  },

  toggleCoverage: () => {
    set(state => ({ showCoverage: !state.showCoverage }));
  },

  autoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    
    const canvas = document.querySelector('canvas');
    const width = canvas?.width || 800;
    const height = canvas?.height || 600;
    
    const newNodes = forceDirectedLayout(nodes, edges, 100, width, height);
    set({ nodes: newNodes, simulationResult: null, routingTables: [] });
  },

  clearAll: () => {
    nodeCounter = 1;
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      connectingFromId: null,
      simulationResult: null,
      routingTables: [],
    });
  },

  setMousePos: (pos: { x: number; y: number } | null) => {
    set({ mousePos: pos });
  },

  calculateRoutingTables: () => {
    const { nodes, edges } = get();
    if (nodes.length < 2) {
      set({ routingTables: [] });
      return;
    }
    const tables = calculateAllRoutingTables(nodes, edges);
    set({ routingTables: tables });
  },

  clearRoutingTables: () => {
    set({ routingTables: [] });
  },
}));
