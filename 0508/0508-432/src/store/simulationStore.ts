import { create } from 'zustand';
import { MaterialType, calculateCollision, getRestitution, CollisionResult } from '@/utils/physics';

export type SimulationMode = 'collision' | 'newton-cradle' | 'separated-axis';
export type AnimationPhase = 'idle' | 'approaching' | 'colliding' | 'separating' | 'sticking' | 'done';

interface SimulationState {
  material1: MaterialType;
  material2: MaterialType;
  restitution: number;
  v1: number;
  v2: number;
  m1: number;
  m2: number;
  isRunning: boolean;
  phase: AnimationPhase;
  result: CollisionResult | null;
  mode: SimulationMode;
  showResult: boolean;

  setMaterial1: (m: MaterialType) => void;
  setMaterial2: (m: MaterialType) => void;
  setRestitution: (e: number) => void;
  setV1: (v: number) => void;
  setV2: (v: number) => void;
  setM1: (m: number) => void;
  setM2: (m: number) => void;
  setPhase: (p: AnimationPhase) => void;
  setMode: (m: SimulationMode) => void;
  start: () => void;
  reset: () => void;
  computeResult: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  material1: 'rubber',
  material2: 'steel',
  restitution: getRestitution('rubber', 'steel'),
  v1: 5,
  v2: -3,
  m1: 2,
  m2: 3,
  isRunning: false,
  phase: 'idle',
  result: null,
  mode: 'collision',
  showResult: false,

  setMaterial1: (m) => {
    const state = get();
    const newE = m === 'custom' || state.material2 === 'custom'
      ? state.restitution
      : getRestitution(m, state.material2);
    set({ material1: m, restitution: newE });
  },
  setMaterial2: (m) => {
    const state = get();
    const newE = m === 'custom' || state.material1 === 'custom'
      ? state.restitution
      : getRestitution(state.material1, m);
    set({ material2: m, restitution: newE });
  },
  setRestitution: (e) => set({ restitution: e }),
  setV1: (v) => set({ v1: v }),
  setV2: (v) => set({ v2: v }),
  setM1: (m) => set({ m1: m }),
  setM2: (m) => set({ m2: m }),
  setPhase: (p) => set({ phase: p }),
  setMode: (m) => set({ mode: m, isRunning: false, phase: 'idle', result: null, showResult: false }),
  start: () => {
    const state = get();
    const result = calculateCollision(state.m1, state.m2, state.v1, state.v2, state.restitution);
    set({ isRunning: true, phase: 'approaching', result, showResult: true });
  },
  reset: () => set({ isRunning: false, phase: 'idle', result: null, showResult: false }),
  computeResult: () => {
    const state = get();
    const result = calculateCollision(state.m1, state.m2, state.v1, state.v2, state.restitution);
    set({ result, showResult: true });
  },
}));
