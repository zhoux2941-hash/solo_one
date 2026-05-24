import { create } from 'zustand';
import type {
  Specimen,
  Seal,
  Cabinet,
  CabinetVersion,
  DiffRecord,
  AcceptanceRecord,
  Position,
} from '../../shared/types';
import {
  mockSpecimens,
  mockSeals,
  mockCabinets,
  mockCabinetVersions,
  mockDiffs,
  mockAcceptances,
} from '../../shared/mockData';

interface AppState {
  specimens: Specimen[];
  seals: Seal[];
  cabinets: Cabinet[];
  cabinetVersions: CabinetVersion[];
  diffs: DiffRecord[];
  acceptances: AcceptanceRecord[];
  selectedCabinetId: string;
  isLoading: boolean;
  
  setSelectedCabinetId: (id: string) => void;
  loadAllData: () => void;
  updateSpecimenPosition: (specimenId: string, position: Position) => DiffRecord | null;
  updateSpecimenStatus: (specimenId: string, status: Specimen['status']) => void;
  resolveDiff: (diffId: string, notes?: string) => void;
  approveDiff: (diffId: string) => void;
  unsealSeal: (sealId: string) => void;
  getSpecimensByCabinet: (cabinetId: string) => Specimen[];
  getSpecimensByStatus: (status: Specimen['status']) => Specimen[];
  getReturnedSpecimens: () => Specimen[];
  getUnverifiedSpecimens: () => Specimen[];
}

export const useAppStore = create<AppState>((set, get) => ({
  specimens: mockSpecimens,
  seals: mockSeals,
  cabinets: mockCabinets,
  cabinetVersions: mockCabinetVersions,
  diffs: mockDiffs,
  acceptances: mockAcceptances,
  selectedCabinetId: 'cab-a',
  isLoading: false,

  setSelectedCabinetId: (id) => set({ selectedCabinetId: id }),

  loadAllData: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({
        specimens: mockSpecimens,
        seals: mockSeals,
        cabinets: mockCabinets,
        cabinetVersions: mockCabinetVersions,
        diffs: mockDiffs,
        acceptances: mockAcceptances,
        isLoading: false,
      });
    }, 300);
  },

  updateSpecimenPosition: (specimenId, position) => {
    const state = get();
    const specimen = state.specimens.find(s => s.id === specimenId);
    if (!specimen) return null;

    const occupyingSpecimen = state.specimens.find(
      s => s.id !== specimenId && 
           s.currentPosition?.row === position.row && 
           s.currentPosition?.col === position.col
    );

    const isSamePosition = 
      specimen.originalPosition.row === position.row &&
      specimen.originalPosition.col === position.col;

    set(state => ({
      specimens: state.specimens.map(s => {
        if (s.id === specimenId) {
          return { ...s, currentPosition: position, status: isSamePosition ? 'verified' : 'returned' };
        }
        if (occupyingSpecimen && s.id === occupyingSpecimen.id) {
          return { ...s, currentPosition: undefined, status: 'returned' };
        }
        return s;
      }),
    }));

    if (occupyingSpecimen) {
      set(state => ({
        diffs: state.diffs.filter(d => d.specimenId !== occupyingSpecimen.id),
      }));
    }

    const currentState = get();
    const existingDiff = currentState.diffs.find(
      d => d.specimenId === specimenId && d.status === 'pending'
    );

    if (isSamePosition) {
      if (existingDiff) {
        set(state => ({
          diffs: state.diffs.filter(d => d.id !== existingDiff.id),
        }));
      }
      return null;
    } else {
      if (existingDiff) {
        set(state => ({
          diffs: state.diffs.map(d =>
            d.id === existingDiff.id
              ? { ...d, actualPosition: position, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
        return { ...existingDiff, actualPosition: position };
      } else {
        const newDiff: DiffRecord = {
          id: `diff-${Date.now()}`,
          specimenId,
          specimenName: specimen.name,
          specimenCode: specimen.code,
          expectedPosition: specimen.originalPosition,
          actualPosition: position,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          diffs: [...state.diffs, newDiff],
        }));

        return newDiff;
      }
    }
  },

  updateSpecimenStatus: (specimenId, status) => {
    set(state => ({
      specimens: state.specimens.map(s =>
        s.id === specimenId ? { ...s, status } : s
      ),
    }));
  },

  resolveDiff: (diffId, notes) => {
    set(state => ({
      diffs: state.diffs.map(d =>
        d.id === diffId
          ? {
              ...d,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedBy: '当前用户',
              notes,
            }
          : d
      ),
    }));
  },

  approveDiff: (diffId) => {
    set(state => ({
      diffs: state.diffs.map(d =>
        d.id === diffId ? { ...d, status: 'approved' } : d
      ),
    }));
  },

  unsealSeal: (sealId) => {
    set(state => ({
      seals: state.seals.map(s =>
        s.id === sealId
          ? { ...s, status: 'unsealed', unsealedAt: new Date().toISOString() }
          : s
      ),
    }));
  },

  getSpecimensByCabinet: (cabinetId) => {
    return get().specimens.filter(s => s.originalCabinetId === cabinetId);
  },

  getSpecimensByStatus: (status) => {
    return get().specimens.filter(s => s.status === status);
  },

  getReturnedSpecimens: () => {
    return get().specimens.filter(s => s.status === 'returned' && !s.currentPosition);
  },

  getUnverifiedSpecimens: () => {
    return get().specimens.filter(s => s.status === 'returned' && s.currentPosition);
  },
}));
