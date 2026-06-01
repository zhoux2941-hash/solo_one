import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  LadderProgram,
  LadderRung,
  PlcElement,
  PlcIoState,
  SimMode,
} from '../types/plc';

interface ProjectInfo {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface PlcState {
  program: LadderProgram;
  selectedElementId: string | null;
  ioState: PlcIoState;
  simMode: SimMode;
  bytecodeSize: number | null;
  scanCycle: number;
  currentProjectId: number | null;
  projectName: string;
  projectsList: ProjectInfo[];
  addElement: (rungId: string, element: PlcElement) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<PlcElement>) => void;
  addRung: (index?: number) => void;
  removeRung: (rungId: string) => void;
  setIoState: (ioState: PlcIoState) => void;
  setSimMode: (mode: SimMode) => void;
  setInput: (index: number, value: boolean) => void;
  setSelectedElement: (id: string | null) => void;
  setProgram: (program: LadderProgram) => void;
  setBytecodeSize: (size: number | null) => void;
  setScanCycle: (cycle: number) => void;
  setProjectsList: (projects: ProjectInfo[]) => void;
  setCurrentProject: (id: number | null, name: string) => void;
}

const createEmptyRung = (): LadderRung => ({
  id: uuidv4(),
  elements: [],
});

const createInitialIoState = (): PlcIoState => ({
  inputs: new Array(8).fill(false),
  outputs: new Array(8).fill(false),
  relays: new Array(16).fill(false),
  timers: new Array(8).fill(null).map(() => ({
    active: false,
    done: false,
    elapsed: 0,
    preset: 0,
  })),
  counters: new Array(8).fill(null).map(() => ({
    done: false,
    current: 0,
    preset: 0,
  })),
});

export const usePlcStore = create<PlcState>((set) => ({
  program: {
    rungs: [createEmptyRung(), createEmptyRung()],
  },
  selectedElementId: null,
  ioState: createInitialIoState(),
  simMode: 'stopped',
  bytecodeSize: null,
  scanCycle: 0,
  currentProjectId: null,
  projectName: '',
  projectsList: [],

  addElement: (rungId: string, element: PlcElement) =>
    set((state) => ({
      program: {
        ...state.program,
        rungs: state.program.rungs.map((rung) =>
          rung.id === rungId
            ? { ...rung, elements: [...rung.elements, element] }
            : rung
        ),
      },
    })),

  removeElement: (elementId: string) =>
    set((state) => ({
      program: {
        ...state.program,
        rungs: state.program.rungs.map((rung) => ({
          ...rung,
          elements: rung.elements.filter((el) => el.id !== elementId),
        })),
      },
      selectedElementId:
        state.selectedElementId === elementId ? null : state.selectedElementId,
    })),

  updateElement: (elementId: string, updates: Partial<PlcElement>) =>
    set((state) => ({
      program: {
        ...state.program,
        rungs: state.program.rungs.map((rung) => ({
          ...rung,
          elements: rung.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        })),
      },
    })),

  addRung: (index?: number) =>
    set((state) => {
      const newRung = createEmptyRung();
      const rungs = [...state.program.rungs];
      if (index !== undefined && index >= 0 && index <= rungs.length) {
        rungs.splice(index, 0, newRung);
      } else {
        rungs.push(newRung);
      }
      return {
        program: {
          ...state.program,
          rungs,
        },
      };
    }),

  removeRung: (rungId: string) =>
    set((state) => ({
      program: {
        ...state.program,
        rungs: state.program.rungs.filter((rung) => rung.id !== rungId),
      },
    })),

  setIoState: (ioState: PlcIoState) => set({ ioState }),

  setSimMode: (mode: SimMode) => set({ simMode: mode }),

  setInput: (index: number, value: boolean) =>
    set((state) => {
      const inputs = [...state.ioState.inputs];
      inputs[index] = value;
      return {
        ioState: {
          ...state.ioState,
          inputs,
        },
      };
    }),

  setSelectedElement: (id: string | null) => set({ selectedElementId: id }),

  setProgram: (program: LadderProgram) => set({ program }),

  setBytecodeSize: (size: number | null) => set({ bytecodeSize: size }),

  setScanCycle: (cycle: number) => set({ scanCycle: cycle }),

  setProjectsList: (projects: ProjectInfo[]) => set({ projectsList: projects }),

  setCurrentProject: (id: number | null, name: string) =>
    set({ currentProjectId: id, projectName: name }),
}));
