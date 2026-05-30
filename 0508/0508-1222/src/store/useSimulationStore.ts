import { create } from 'zustand';
import {
  PointCharge,
  Particle,
  MagneticField,
  SimulationState,
  DisplayConfig,
  ToolType,
  generateId,
  MAX_TRAJECTORY_LENGTH,
  ConductorSphere,
  CONDUCTOR_DEFAULT_RADIUS,
} from '@/types/physics';
import { rungeKutta4Step } from '@/utils/physics/rk4Integrator';

interface SimulationStore {
  charges: PointCharge[];
  particles: Particle[];
  conductors: ConductorSphere[];
  magneticField: MagneticField;
  simulationState: SimulationState;
  displayConfig: DisplayConfig;
  currentTool: ToolType;
  selectedChargeId: string | null;
  selectedConductorId: string | null;
  selectedParticleId: string | null;
  newParticleCharge: number;
  newParticleMass: number;
  newParticleSpeed: number;
  newConductorRadius: number;

  setCurrentTool: (tool: ToolType) => void;
  addCharge: (x: number, y: number, type: 'positive' | 'negative') => void;
  removeCharge: (id: string) => void;
  updateChargePosition: (id: string, x: number, y: number) => void;
  selectCharge: (id: string | null) => void;
  addConductor: (x: number, y: number) => void;
  removeConductor: (id: string) => void;
  updateConductorPosition: (id: string, x: number, y: number) => void;
  updateConductorRadius: (id: string, radius: number) => void;
  selectConductor: (id: string | null) => void;
  setNewConductorRadius: (radius: number) => void;
  selectParticle: (id: string | null) => void;
  clearAll: () => void;
  clearParticles: () => void;
  addParticle: (x: number, y: number, angle: number) => void;
  setNewParticleCharge: (charge: number) => void;
  setNewParticleMass: (mass: number) => void;
  setNewParticleSpeed: (speed: number) => void;
  updateParticles: () => void;
  setRunning: (running: boolean) => void;
  setDt: (dt: number) => void;
  setMagneticFieldStrength: (strength: number) => void;
  setMagneticFieldDirection: (direction: 'into' | 'out') => void;
  setVectorGridDensity: (density: number) => void;
  setFieldLineDensity: (density: number) => void;
  toggleShowVectorField: () => void;
  toggleShowFieldLines: () => void;
  toggleShowTrajectories: () => void;
  toggleShowGrid: () => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  charges: [],
  particles: [],
  conductors: [],
  magneticField: {
    strength: 0,
    direction: 'out',
  },
  simulationState: {
    running: false,
    dt: 0.01,
    time: 0,
  },
  displayConfig: {
    vectorGridDensity: 50,
    fieldLineDensity: 50,
    showVectorField: true,
    showFieldLines: true,
    showTrajectories: true,
    showGrid: true,
  },
  currentTool: 'select',
  selectedChargeId: null,
  selectedConductorId: null,
  selectedParticleId: null,
  newParticleCharge: 1,
  newParticleMass: 1,
  newParticleSpeed: 50,
  newConductorRadius: CONDUCTOR_DEFAULT_RADIUS,

  setCurrentTool: (tool) => set({ currentTool: tool }),

  addCharge: (x, y, type) =>
    set((state) => ({
      charges: [
        ...state.charges,
        {
          id: generateId(),
          x,
          y,
          charge: type === 'positive' ? 1e-6 : -1e-6,
        },
      ],
    })),

  removeCharge: (id) =>
    set((state) => ({
      charges: state.charges.filter((c) => c.id !== id),
      selectedChargeId: state.selectedChargeId === id ? null : state.selectedChargeId,
    })),

  updateChargePosition: (id, x, y) =>
    set((state) => ({
      charges: state.charges.map((c) => (c.id === id ? { ...c, x, y } : c)),
    })),

  selectCharge: (id) => set({ selectedChargeId: id }),

  addConductor: (x, y) =>
    set((state) => ({
      conductors: [
        ...state.conductors,
        {
          id: generateId(),
          x,
          y,
          radius: state.newConductorRadius,
        },
      ],
    })),

  removeConductor: (id) =>
    set((state) => ({
      conductors: state.conductors.filter((c) => c.id !== id),
      selectedConductorId: state.selectedConductorId === id ? null : state.selectedConductorId,
    })),

  updateConductorPosition: (id, x, y) =>
    set((state) => ({
      conductors: state.conductors.map((c) => (c.id === id ? { ...c, x, y } : c)),
    })),

  updateConductorRadius: (id, radius) =>
    set((state) => ({
      conductors: state.conductors.map((c) => (c.id === id ? { ...c, radius: Math.max(20, radius) } : c)),
    })),

  selectConductor: (id) => set({ selectedConductorId: id }),

  setNewConductorRadius: (radius) => set({ newConductorRadius: Math.max(20, radius) }),

  selectParticle: (id) => set({ selectedParticleId: id }),

  clearAll: () =>
    set({
      charges: [],
      particles: [],
      conductors: [],
      selectedChargeId: null,
      selectedConductorId: null,
      selectedParticleId: null,
    }),

  clearParticles: () =>
    set({
      particles: [],
      selectedParticleId: null,
    }),

  addParticle: (x, y, angle) =>
    set((state) => ({
      particles: [
        ...state.particles,
        {
          id: generateId(),
          x,
          y,
          vx: state.newParticleSpeed * Math.cos(angle),
          vy: state.newParticleSpeed * Math.sin(angle),
          charge: state.newParticleCharge * 1e-6,
          mass: state.newParticleMass * 1e-9,
          trajectory: [{ x, y }],
        },
      ],
    })),

  setNewParticleCharge: (charge) => set({ newParticleCharge: charge }),
  setNewParticleMass: (mass) => set({ newParticleMass: mass }),
  setNewParticleSpeed: (speed) => set({ newParticleSpeed: speed }),

  updateParticles: () => {
    const state = get();
    if (!state.simulationState.running) return;

    set((state) => {
      const width = window.innerWidth * 0.7;
      const height = window.innerHeight - 60;

      const updatedParticles = state.particles
        .map((particle) => {
          const newState = rungeKutta4Step(
            particle,
            state.charges,
            state.magneticField,
            state.simulationState.dt
          );

          if (newState.x < -100 || newState.x > width + 100 || newState.y < -100 || newState.y > height + 100) {
            return null;
          }

          const newTrajectory = [...particle.trajectory, { x: newState.x, y: newState.y }];
          if (newTrajectory.length > MAX_TRAJECTORY_LENGTH) {
            newTrajectory.shift();
          }

          return {
            ...particle,
            x: newState.x,
            y: newState.y,
            vx: newState.vx,
            vy: newState.vy,
            trajectory: newTrajectory,
          };
        })
        .filter((p): p is Particle => p !== null);

      return {
        particles: updatedParticles,
        simulationState: {
          ...state.simulationState,
          time: state.simulationState.time + state.simulationState.dt,
        },
      };
    });
  },

  setRunning: (running) =>
    set((state) => ({
      simulationState: { ...state.simulationState, running },
    })),

  setDt: (dt) =>
    set((state) => ({
      simulationState: { ...state.simulationState, dt },
    })),

  setMagneticFieldStrength: (strength) =>
    set((state) => ({
      magneticField: { ...state.magneticField, strength },
    })),

  setMagneticFieldDirection: (direction) =>
    set((state) => ({
      magneticField: { ...state.magneticField, direction },
    })),

  setVectorGridDensity: (density) =>
    set((state) => ({
      displayConfig: { ...state.displayConfig, vectorGridDensity: density },
    })),

  setFieldLineDensity: (density) =>
    set((state) => ({
      displayConfig: { ...state.displayConfig, fieldLineDensity: density },
    })),

  toggleShowVectorField: () =>
    set((state) => ({
      displayConfig: {
        ...state.displayConfig,
        showVectorField: !state.displayConfig.showVectorField,
      },
    })),

  toggleShowFieldLines: () =>
    set((state) => ({
      displayConfig: {
        ...state.displayConfig,
        showFieldLines: !state.displayConfig.showFieldLines,
      },
    })),

  toggleShowTrajectories: () =>
    set((state) => ({
      displayConfig: {
        ...state.displayConfig,
        showTrajectories: !state.displayConfig.showTrajectories,
      },
    })),

  toggleShowGrid: () =>
    set((state) => ({
      displayConfig: { ...state.displayConfig, showGrid: !state.displayConfig.showGrid },
    })),
}));
