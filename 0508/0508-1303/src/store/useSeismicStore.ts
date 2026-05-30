import { create } from 'zustand';
import { EarthquakeEvent, StationAnnotation, FilterParams, TriangulationResult } from '../types';
import { generatePresetEvents } from '../data/presetEvents';
import { applyFilter } from '../utils/dsp';
import { triangulate } from '../utils/triangulation';

interface SeismicState {
  events: EarthquakeEvent[];
  selectedEvent: EarthquakeEvent | null;
  selectedStationId: string | null;
  stationAnnotations: Record<string, StationAnnotation>;
  filteredStationData: {
    north: number[];
    east: number[];
    vertical: number[];
  } | null;
  filterParams: FilterParams;
  triangulationResult: TriangulationResult | null;
  annotationMode: 'P' | 'S' | null;
  isLoading: boolean;

  loadPresetEvents: () => void;
  selectEvent: (id: string) => void;
  selectStation: (id: string) => void;
  setAnnotationMode: (mode: 'P' | 'S' | null) => void;
  setFilterParams: (params: Partial<FilterParams>) => void;
  recalculateFilteredData: () => void;
  recalculateTriangulation: () => void;
}

const initialFilterParams: FilterParams = {
  type: 'none',
  lowFreq: 1,
  highFreq: 10,
  order: 51
};

export const useSeismicStore = create<SeismicState>((set, get) => ({
  events: [],
  selectedEvent: null,
  selectedStationId: null,
  stationAnnotations: {},
  filteredStationData: null,
  filterParams: initialFilterParams,
  triangulationResult: null,
  annotationMode: null,
  isLoading: false,

  loadPresetEvents: () => {
    set({ isLoading: true });
    const events = generatePresetEvents();
    const firstEvent = events[0];
    const firstStationId = firstEvent?.stations[0]?.id || null;
    set({
      events,
      selectedEvent: firstEvent || null,
      selectedStationId: firstStationId,
      stationAnnotations: {},
      triangulationResult: null,
      isLoading: false
    });
    get().recalculateFilteredData();
  },

  selectEvent: (id: string) => {
    const { events } = get();
    const event = events.find(e => e.id === id);
    if (event) {
      const firstStationId = event.stations[0]?.id || null;
      set({
        selectedEvent: event,
        selectedStationId: firstStationId,
        stationAnnotations: {},
        triangulationResult: null
      });
      get().recalculateFilteredData();
    }
  },

  selectStation: (id: string) => {
    set({ selectedStationId: id });
    get().recalculateFilteredData();
  },

  setAnnotationMode: (mode) => set({ annotationMode: mode }),

  setFilterParams: (params) => {
    set(state => ({
      filterParams: { ...state.filterParams, ...params }
    }));
    get().recalculateFilteredData();
  },

  recalculateFilteredData: () => {
    const { selectedEvent, selectedStationId, filterParams } = get();
    if (!selectedEvent || !selectedStationId) {
      set({ filteredStationData: null });
      return;
    }

    const waveform = selectedEvent.waveforms.find(w => w.stationId === selectedStationId);
    if (!waveform) {
      set({ filteredStationData: null });
      return;
    }

    const { components, sampleRate } = waveform;
    const filteredStationData = {
      north: applyFilter(components.north, filterParams, sampleRate),
      east: applyFilter(components.east, filterParams, sampleRate),
      vertical: applyFilter(components.vertical, filterParams, sampleRate)
    };

    set({ filteredStationData });
  },

  recalculateTriangulation: () => {
    const { selectedEvent, stationAnnotations } = get();
    if (!selectedEvent) {
      set({ triangulationResult: null });
      return;
    }

    const result = triangulate(selectedEvent.stations, stationAnnotations);
    set({ triangulationResult: result });
  }
}));
