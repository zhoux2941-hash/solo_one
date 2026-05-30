import { create } from 'zustand';
import type { SatelliteInfo, LLA, DayPasses, UserLocation } from '@/types';
import { SATELLITES } from '@/data/satellites';

interface AppState {
  selectedSatellite: SatelliteInfo | null;
  satellites: SatelliteInfo[];
  userLocation: UserLocation;
  simulatedTime: Date;
  timeSpeed: number;
  isPlaying: boolean;
  passPredictions: DayPasses[];
  isLoadingPasses: boolean;
  showLocationModal: boolean;
  showAllOrbits: boolean;

  setSelectedSatellite: (sat: SatelliteInfo) => void;
  setUserLocation: (loc: UserLocation) => void;
  setSimulatedTime: (time: Date) => void;
  setTimeSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPassPredictions: (passes: DayPasses[]) => void;
  setIsLoadingPasses: (loading: boolean) => void;
  setShowLocationModal: (show: boolean) => void;
  setShowAllOrbits: (show: boolean) => void;
  advanceTime: (deltaMs: number) => void;
}

const DEFAULT_LOCATION: UserLocation = {
  lat: 39.9042,
  lon: 116.4074,
  alt: 0.05,
  name: '北京',
};

export const useAppStore = create<AppState>((set) => ({
  selectedSatellite: SATELLITES[0],
  satellites: SATELLITES,
  userLocation: DEFAULT_LOCATION,
  simulatedTime: new Date(),
  timeSpeed: 1,
  isPlaying: true,
  passPredictions: [],
  isLoadingPasses: false,
  showLocationModal: false,
  showAllOrbits: true,

  setSelectedSatellite: (sat) => set({ selectedSatellite: sat }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setSimulatedTime: (time) => set({ simulatedTime: time }),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPassPredictions: (passes) => set({ passPredictions: passes }),
  setIsLoadingPasses: (loading) => set({ isLoadingPasses: loading }),
  setShowLocationModal: (show) => set({ showLocationModal: show }),
  setShowAllOrbits: (show) => set({ showAllOrbits: show }),
  advanceTime: (deltaMs) =>
    set((state) => ({
      simulatedTime: new Date(state.simulatedTime.getTime() + deltaMs),
    })),
}));
