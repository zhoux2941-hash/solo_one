import { create } from 'zustand';
import type { CircuitParams, Preset } from '@/types';

export const PRESETS: Preset[] = [
  {
    id: 'custom',
    name: '自定义',
    description: '自由调节参数',
    icon: '⚙️',
    params: { resistance: 10, capacitance: 100, voltage: 12 },
  },
  {
    id: 'low-pass',
    name: '低通滤波器',
    description: '典型音频应用 R=1kΩ C=1μF',
    icon: '🔻',
    params: { resistance: 1, capacitance: 1, voltage: 5 },
  },
  {
    id: 'high-pass',
    name: '高通滤波器',
    description: '典型耦合电路 R=10kΩ C=10μF',
    icon: '🔺',
    params: { resistance: 10, capacitance: 10, voltage: 5 },
  },
  {
    id: 'slow-charge',
    name: '慢速充电',
    description: '大时间常数 R=100kΩ C=1000μF',
    icon: '🐢',
    params: { resistance: 100, capacitance: 1000, voltage: 12 },
  },
  {
    id: 'fast-charge',
    name: '快速充放电',
    description: '小时间常数 R=0.1kΩ C=0.1μF',
    icon: '⚡',
    params: { resistance: 0.1, capacitance: 0.1, voltage: 5 },
  },
];

interface CircuitStore {
  params: CircuitParams;
  activePreset: string;
  setResistance: (r: number) => void;
  setCapacitance: (c: number) => void;
  setVoltage: (v: number) => void;
  setParams: (params: CircuitParams) => void;
  setActivePreset: (id: string) => void;
}

export const useCircuitStore = create<CircuitStore>((set) => ({
  params: { resistance: 10, capacitance: 100, voltage: 12 },
  activePreset: 'custom',
  setResistance: (r) =>
    set((state) => ({
      params: { ...state.params, resistance: r },
      activePreset: 'custom',
    })),
  setCapacitance: (c) =>
    set((state) => ({
      params: { ...state.params, capacitance: c },
      activePreset: 'custom',
    })),
  setVoltage: (v) =>
    set((state) => ({
      params: { ...state.params, voltage: v },
      activePreset: 'custom',
    })),
  setParams: (params) => set({ params, activePreset: 'custom' }),
  setActivePreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      set({ params: { ...preset.params }, activePreset: id });
    }
  },
}));
