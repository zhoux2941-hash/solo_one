import { create } from 'zustand';
import type { Dynasty, ModuleData, ComponentResult, Preset } from '@/lib/types';
import { getMaterialGrade, getAllPresets } from '@/lib/database';
import { calculateComponents } from '@/lib/calculator';

interface DougongStore {
  dynasty: Dynasty;
  grade: number;
  jumps: number;
  moduleData: ModuleData | null;
  components: ComponentResult[];
  presets: Preset[];
  dbReady: boolean;
  setDynasty: (dynasty: Dynasty) => void;
  setGrade: (grade: number) => void;
  setJumps: (jumps: number) => void;
  loadPreset: (preset: Preset) => void;
  initDb: () => Promise<void>;
  recalculate: () => void;
}

export const useDougongStore = create<DougongStore>((set, get) => ({
  dynasty: '宋',
  grade: 1,
  jumps: 3,
  moduleData: null,
  components: [],
  presets: [],
  dbReady: false,

  setDynasty: (dynasty: Dynasty) => {
    set({ dynasty });
    get().recalculate();
  },

  setGrade: (grade: number) => {
    set({ grade });
    get().recalculate();
  },

  setJumps: (jumps: number) => {
    set({ jumps });
    get().recalculate();
  },

  loadPreset: (preset: Preset) => {
    set({
      dynasty: preset.dynasty,
      grade: preset.grade,
      jumps: preset.jumps,
    });
    get().recalculate();
  },

  initDb: async () => {
    const { initDatabase } = await import('@/lib/database');
    await initDatabase();
    const presets = getAllPresets();
    set({ dbReady: true, presets });
    get().recalculate();
  },

  recalculate: () => {
    const { dynasty, grade, jumps } = get();
    const moduleData = getMaterialGrade(dynasty, grade);
    if (!moduleData) return;
    const components = calculateComponents(dynasty, jumps, moduleData);
    set({ moduleData, components });
  },
}));
