import { create } from 'zustand';
import type { DivinationState, ShellType, PitShape, Inscription, OracleExample, CrackPoint } from '@/types';
import { generateCrackPoints } from '@/utils/crackEngine';

interface DivinationActions {
  setShellType: (shellType: ShellType) => void;
  setPitShape: (pitShape: PitShape) => void;
  setTemperature: (temperature: number) => void;
  setAnisotropyRatio: (ratio: number) => void;
  setMediumKv: (v: number) => void;
  setMediumKh: (v: number) => void;
  setMediumKd: (v: number) => void;
  generateCracks: () => void;
  addInscription: (inscription: Inscription) => void;
  removeInscription: (id: string) => void;
  updateInscription: (id: string, updates: Partial<Inscription>) => void;
  setSelectedInscription: (id: string | null) => void;
  resetDivination: () => void;
  fetchTemplates: () => Promise<void>;
  fetchExamples: () => Promise<void>;
  loadExample: (example: OracleExample) => void;
}

type DivinationStore = DivinationState & DivinationActions;

export const useDivinationStore = create<DivinationStore>((set, get) => ({
  shellType: 'plastron',
  pitShape: 'jujube',
  temperature: 800,
  anisotropyRatio: 1.5,
  mediumKv: 1.0,
  mediumKh: 1.0,
  mediumKd: 1.0,
  crackPoints: [],
  inscriptions: [],
  isCracking: false,
  hasCracked: false,
  selectedInscription: null,
  templates: [],
  examples: [],

  setShellType: (shellType) => set({ shellType }),
  setPitShape: (pitShape) => set({ pitShape }),
  setTemperature: (temperature) => set({ temperature }),
  setAnisotropyRatio: (anisotropyRatio) => set({ anisotropyRatio }),
  setMediumKv: (v) => set({ mediumKv: v }),
  setMediumKh: (v) => set({ mediumKh: v }),
  setMediumKd: (v) => set({ mediumKd: v }),

  generateCracks: () => {
    set({ isCracking: true });

    const { shellType, pitShape, temperature, anisotropyRatio, mediumKv, mediumKh, mediumKd } = get();
    const crackPoints = generateCrackPoints(
      shellType,
      pitShape,
      temperature,
      anisotropyRatio,
      mediumKv,
      mediumKh,
      mediumKd
    );

    setTimeout(() => {
      set({ crackPoints, isCracking: false, hasCracked: true });
    }, 300);
  },

  addInscription: (inscription) =>
    set((state) => ({ inscriptions: [...state.inscriptions, inscription] })),

  removeInscription: (id) =>
    set((state) => ({
      inscriptions: state.inscriptions.filter((i) => i.id !== id),
      selectedInscription: state.selectedInscription === id ? null : state.selectedInscription,
    })),

  updateInscription: (id, updates) =>
    set((state) => ({
      inscriptions: state.inscriptions.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  setSelectedInscription: (id) => set({ selectedInscription: id }),

  resetDivination: () =>
    set({
      crackPoints: [],
      inscriptions: [],
      isCracking: false,
      hasCracked: false,
      selectedInscription: null,
    }),

  fetchTemplates: async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const result = await response.json();
      if (result.success && result.data) {
        set({ templates: result.data });
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  },

  fetchExamples: async () => {
    try {
      const response = await fetch('/api/examples');
      if (!response.ok) throw new Error('Failed to fetch examples');
      const result = await response.json();
      if (!result.success || !result.data) return;

      const examples: OracleExample[] = result.data.map((ex: Record<string, unknown>) => ({
        ...ex,
        anisotropyRatio: (ex.anisotropyRatio as number) ?? 1.5,
        crackData: typeof ex.crack_data === 'string' ? JSON.parse(ex.crack_data) : (ex.crackData as CrackPoint[]) ?? [],
        inscriptions: typeof ex.inscriptions === 'string' ? JSON.parse(ex.inscriptions) : (ex.inscriptions as Inscription[]) ?? [],
      }));

      set({ examples });
    } catch (error) {
      console.error('Failed to fetch examples:', error);
    }
  },

  loadExample: (example) =>
    set({
      shellType: example.shellType,
      pitShape: example.pitShape,
      temperature: example.temperature,
      anisotropyRatio: example.anisotropyRatio ?? 1.5,
      crackPoints: example.crackData,
      inscriptions: example.inscriptions,
      isCracking: false,
      hasCracked: true,
      selectedInscription: null,
    }),
}));
