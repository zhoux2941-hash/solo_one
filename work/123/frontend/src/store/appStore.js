import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  mode: 'view',
  currentSimulation: null,
  simulations: [],
  activeLayers: {
    roads: true,
    nodes: true,
    vehicles: true,
    heatmap: false,
    trafficLights: true
  },
  visualization: {
    isPlaying: false,
    currentTime: 0,
    totalTime: 0,
    playbackSpeed: 1
  },
  network: {
    nodes: [],
    edges: []
  },
  trafficLights: [],
  trafficFlows: [],
  selectedNode: null,
  selectedEdge: null,
  selectedTrafficLight: null,
  selectedTrafficFlow: null,
  drawingState: {
    startNode: null,
    tempEdge: null
  },
  results: {
    trajectories: [],
    snapshots: [],
    heatmapData: null,
    statistics: null
  },
  optimization: {
    isOptimizing: false,
    optimizationId: null,
    result: null
  },
  simulationProgress: {
    currentSimulationId: null,
    phase: null,
    phaseDescription: null,
    progress: 0,
    progressPercentage: 0,
    currentTime: null,
    totalTime: null,
    isRunning: false,
    isCompleted: false,
    isFailed: false,
    error: null
  },
  queueStatus: {
    redisAvailable: false,
    queue: null
  },
  alerts: [],

  setMode: (mode) => set({ mode }),
  
  setCurrentSimulation: (simulation) => set({ currentSimulation: simulation }),
  
  setSimulations: (simulations) => set({ simulations }),
  
  addSimulation: (simulation) => set((state) => ({
    simulations: [simulation, ...state.simulations]
  })),

  toggleLayer: (layer) => set((state) => ({
    activeLayers: {
      ...state.activeLayers,
      [layer]: !state.activeLayers[layer]
    }
  })),

  setActiveLayers: (layers) => set({ activeLayers: layers }),

  setVisualization: (visualization) => set((state) => ({
    visualization: { ...state.visualization, ...visualization }
  })),

  setNetwork: (network) => set({ network }),
  
  addNode: (node) => set((state) => ({
    network: {
      ...state.network,
      nodes: [...state.network.nodes, node]
    }
  })),

  updateNode: (nodeId, updates) => set((state) => ({
    network: {
      ...state.network,
      nodes: state.network.nodes.map(n => 
        n.id === nodeId ? { ...n, ...updates } : n
      )
    }
  })),

  removeNode: (nodeId) => set((state) => ({
    network: {
      nodes: state.network.nodes.filter(n => n.id !== nodeId),
      edges: state.network.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
    }
  })),

  addEdge: (edge) => set((state) => ({
    network: {
      ...state.network,
      edges: [...state.network.edges, edge]
    }
  })),

  updateEdge: (edgeId, updates) => set((state) => ({
    network: {
      ...state.network,
      edges: state.network.edges.map(e => 
        e.id === edgeId ? { ...e, ...updates } : e
      )
    }
  })),

  removeEdge: (edgeId) => set((state) => ({
    network: {
      ...state.network,
      edges: state.network.edges.filter(e => e.id !== edgeId)
    }
  })),

  clearNetwork: () => set({
    network: { nodes: [], edges: [] },
    trafficLights: [],
    trafficFlows: []
  }),

  setTrafficLights: (trafficLights) => set({ trafficLights }),
  
  addTrafficLight: (trafficLight) => set((state) => ({
    trafficLights: [...state.trafficLights, trafficLight]
  })),

  updateTrafficLight: (intersectionId, updates) => set((state) => ({
    trafficLights: state.trafficLights.map(tl =>
      tl.intersectionId === intersectionId ? { ...tl, ...updates } : tl
    )
  })),

  removeTrafficLight: (intersectionId) => set((state) => ({
    trafficLights: state.trafficLights.filter(tl => tl.intersectionId !== intersectionId)
  })),

  setTrafficFlows: (trafficFlows) => set({ trafficFlows }),
  
  addTrafficFlow: (trafficFlow) => set((state) => ({
    trafficFlows: [...state.trafficFlows, trafficFlow]
  })),

  updateTrafficFlow: (flowId, updates) => set((state) => ({
    trafficFlows: state.trafficFlows.map(tf =>
      tf.id === flowId ? { ...tf, ...updates } : tf
    )
  })),

  removeTrafficFlow: (flowId) => set((state) => ({
    trafficFlows: state.trafficFlows.filter(tf => tf.id !== flowId)
  })),

  setSelectedNode: (node) => set({ selectedNode: node }),
  
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  
  setSelectedTrafficLight: (tl) => set({ selectedTrafficLight: tl }),
  
  setSelectedTrafficFlow: (tf) => set({ selectedTrafficFlow: tf }),

  setDrawingState: (state) => set({ drawingState: state }),

  setResults: (results) => set((state) => ({
    results: { ...state.results, ...results }
  })),

  clearResults: () => set({
    results: {
      trajectories: [],
      snapshots: [],
      heatmapData: null,
      statistics: null
    }
  }),

  setOptimization: (optimization) => set((state) => ({
    optimization: { ...state.optimization, ...optimization }
  })),

  clearOptimization: () => set({
    optimization: {
      isOptimizing: false,
      optimizationId: null,
      result: null
    }
  }),

  setSimulationProgress: (progress) => set((state) => ({
    simulationProgress: {
      ...state.simulationProgress,
      ...progress
    }
  })),

  updateSimulationProgress: (progressData) => {
    set((state) => {
      const newProgress = {
        ...state.simulationProgress,
        ...progressData,
        isRunning: !progressData.isCompleted && !progressData.isFailed && !progressData.failed,
        isCompleted: progressData.isCompleted || progressData.completed,
        isFailed: progressData.isFailed || progressData.failed,
        error: progressData.error || progressData.error
      };
      
      return { simulationProgress: newProgress };
    });
  },

  clearSimulationProgress: () => set({
    simulationProgress: {
      currentSimulationId: null,
      phase: null,
      phaseDescription: null,
      progress: 0,
      progressPercentage: 0,
      currentTime: null,
      totalTime: null,
      isRunning: false,
      isCompleted: false,
      isFailed: false,
      error: null
    }
  }),

  setQueueStatus: (queueStatus) => set({ queueStatus }),

  addAlert: (alert) => set((state) => ({
    alerts: [...state.alerts, { ...alert, id: Date.now() }]
  })),

  removeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== alertId)
  }))
}));

export default useAppStore;
