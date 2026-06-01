import { create } from "zustand";
import { DEFAULT_PARAMS } from "@/utils/diffraction";

interface SimulationState {
  d: number;
  a: number;
  N: number;
  lambda: number;
  showEnvelope: boolean;
  showEnvelopeOnly: boolean;
  sodiumMode: boolean;
  setD: (d: number) => void;
  setA: (a: number) => void;
  setN: (n: number) => void;
  setLambda: (lambda: number) => void;
  setShowEnvelope: (v: boolean) => void;
  setShowEnvelopeOnly: (v: boolean) => void;
  setSodiumMode: (v: boolean) => void;
  resetDefaults: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  d: DEFAULT_PARAMS.d,
  a: DEFAULT_PARAMS.a,
  N: DEFAULT_PARAMS.N,
  lambda: DEFAULT_PARAMS.lambda,
  showEnvelope: true,
  showEnvelopeOnly: false,
  sodiumMode: false,
  setD: (d) => set({ d }),
  setA: (a) => set({ a }),
  setN: (N) => set({ N }),
  setLambda: (lambda) => set({ lambda }),
  setShowEnvelope: (showEnvelope) => set({ showEnvelope }),
  setShowEnvelopeOnly: (showEnvelopeOnly) => set({ showEnvelopeOnly }),
  setSodiumMode: (sodiumMode) => set({ sodiumMode }),
  resetDefaults: () =>
    set({
      d: DEFAULT_PARAMS.d,
      a: DEFAULT_PARAMS.a,
      N: DEFAULT_PARAMS.N,
      lambda: DEFAULT_PARAMS.lambda,
      showEnvelope: true,
      showEnvelopeOnly: false,
      sodiumMode: false,
    }),
}));
