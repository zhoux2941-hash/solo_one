import { create } from 'zustand';
import type {
  SupplyChainNetwork,
  SupplyNode,
  Dependency,
  Simulation,
  SimulationResult,
  GraphNode,
  GraphLink,
} from '@/types';

interface AppState {
  networks: SupplyChainNetwork[];
  currentNetwork: SupplyChainNetwork | null;
  nodes: SupplyNode[];
  dependencies: Dependency[];
  simulations: Simulation[];
  currentSimulation: Simulation | null;
  simulationResult: SimulationResult | null;
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
  selectedNode: string | null;
  disruptedNodes: Set<string>;
  isSimulating: boolean;
  animationStep: number;
  maxAnimationSteps: number;
  isAnimationPlaying: boolean;
  
  setNetworks: (networks: SupplyChainNetwork[]) => void;
  setCurrentNetwork: (network: SupplyChainNetwork | null) => void;
  setNodes: (nodes: SupplyNode[]) => void;
  setDependencies: (dependencies: Dependency[]) => void;
  setSimulations: (simulations: Simulation[]) => void;
  setCurrentSimulation: (simulation: Simulation | null) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setGraphData: (nodes: GraphNode[], links: GraphLink[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  toggleDisruptedNode: (nodeId: string) => void;
  clearDisruptedNodes: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  setAnimationStep: (step: number) => void;
  setMaxAnimationSteps: (steps: number) => void;
  setIsAnimationPlaying: (isPlaying: boolean) => void;
  resetState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  networks: [],
  currentNetwork: null,
  nodes: [],
  dependencies: [],
  simulations: [],
  currentSimulation: null,
  simulationResult: null,
  graphNodes: [],
  graphLinks: [],
  selectedNode: null,
  disruptedNodes: new Set(),
  isSimulating: false,
  animationStep: 0,
  maxAnimationSteps: 0,
  isAnimationPlaying: false,

  setNetworks: (networks) => set({ networks }),
  setCurrentNetwork: (network) => set({ 
    currentNetwork: network,
    nodes: [],
    dependencies: [],
    simulations: [],
    currentSimulation: null,
    simulationResult: null,
    graphNodes: [],
    graphLinks: [],
    selectedNode: null,
    disruptedNodes: new Set(),
  }),
  setNodes: (nodes) => set({ nodes }),
  setDependencies: (dependencies) => set({ dependencies }),
  setSimulations: (simulations) => set({ simulations }),
  setCurrentSimulation: (simulation) => set({ currentSimulation: simulation }),
  setSimulationResult: (result) => set({ simulationResult: result }),
  setGraphData: (nodes, links) => set({ graphNodes: nodes, graphLinks: links }),
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  toggleDisruptedNode: (nodeId) => set((state) => {
    const newSet = new Set(state.disruptedNodes);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    return { disruptedNodes: newSet };
  }),
  clearDisruptedNodes: () => set({ disruptedNodes: new Set() }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setAnimationStep: (step) => set({ animationStep: step }),
  setMaxAnimationSteps: (steps) => set({ maxAnimationSteps: steps }),
  setIsAnimationPlaying: (isPlaying) => set({ isAnimationPlaying: isPlaying }),
  resetState: () => set({
    currentNetwork: null,
    nodes: [],
    dependencies: [],
    simulations: [],
    currentSimulation: null,
    simulationResult: null,
    graphNodes: [],
    graphLinks: [],
    selectedNode: null,
    disruptedNodes: new Set(),
    isSimulating: false,
    animationStep: 0,
    maxAnimationSteps: 0,
    isAnimationPlaying: false,
  }),
}));
