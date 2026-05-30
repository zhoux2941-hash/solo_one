export interface StationPosition {
  id: string;
  name: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
}

export interface StationWaveform {
  stationId: string;
  components: {
    north: number[];
    east: number[];
    vertical: number[];
  };
  sampleRate: number;
  duration: number;
  expectedPTime?: number;
  expectedSTime?: number;
}

export interface StationAnnotation {
  pTime: number | null;
  sTime: number | null;
}

export interface EarthquakeEvent {
  id: string;
  name: string;
  location: string;
  magnitude: number;
  depth: number;
  date: string;
  epicenter: {
    lat: number;
    lon: number;
    x: number;
    y: number;
  };
  stations: StationPosition[];
  waveforms: StationWaveform[];
}

export interface EarthquakeData {
  id: string;
  name: string;
  location: string;
  magnitude: number;
  depth: number;
  date: string;
  sampleRate: number;
  startTime: number;
  duration: number;
  components: {
    north: number[];
    east: number[];
    vertical: number[];
  };
  expectedPTime?: number;
  expectedSTime?: number;
}

export interface Annotation {
  type: 'P' | 'S';
  time: number;
  component?: 'north' | 'east' | 'vertical';
}

export interface FilterParams {
  type: 'none' | 'lowpass' | 'highpass' | 'bandpass';
  lowFreq?: number;
  highFreq?: number;
  order: number;
}

export interface TriangulationResult {
  epicenterX: number;
  epicenterY: number;
  lat: number;
  lon: number;
  stations: {
    id: string;
    name: string;
    distance: number;
    pTime: number | null;
    sTime: number | null;
    psDiff: number | null;
  }[];
  confidence: number;
  circleIntersections: { x: number; y: number }[];
}

export type ComponentType = 'north' | 'east' | 'vertical';

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  north: '南北分量 (N-S)',
  east: '东西分量 (E-W)',
  vertical: '垂直分量 (U-D)'
};

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  north: '#22d3ee',
  east: '#a78bfa',
  vertical: '#34d399'
};

export const STATION_COLORS = [
  '#22d3ee',
  '#f97316',
  '#a78bfa',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#60a5fa',
  '#fb923c'
];
