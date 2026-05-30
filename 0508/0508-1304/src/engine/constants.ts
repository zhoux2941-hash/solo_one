import { WindDirection, WindVector, SimulationParams, PresetConfig } from './types';

export const GRID_SIZE = 100;
export const DEFAULT_SPREAD_RATE = 0.4;
export const DEFAULT_BURN_DURATION = 3;
export const SIMULATION_FPS = 15;

export const WIND_VECTORS: Record<WindDirection, WindVector> = {
  N: { dx: 0, dy: -1, name: 'N', label: '北' },
  NE: { dx: 1, dy: -1, name: 'NE', label: '东北' },
  E: { dx: 1, dy: 0, name: 'E', label: '东' },
  SE: { dx: 1, dy: 1, name: 'SE', label: '东南' },
  S: { dx: 0, dy: 1, name: 'S', label: '南' },
  SW: { dx: -1, dy: 1, name: 'SW', label: '西南' },
  W: { dx: -1, dy: 0, name: 'W', label: '西' },
  NW: { dx: -1, dy: -1, name: 'NW', label: '西北' },
};

export const WIND_DIRECTIONS: WindDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const NEIGHBOR_OFFSETS: [number, number][] = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],          [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
];

export const DEFAULT_PARAMS: SimulationParams = {
  treeDensity: 60,
  humidity: 30,
  windDirection: 'E',
  windStrength: 0.5,
  spreadRate: DEFAULT_SPREAD_RATE,
  burnDuration: DEFAULT_BURN_DURATION,
};

export const PRESET_SCENES: Record<string, PresetConfig> = {
  'dry-windy': {
    name: '干燥多风',
    description: '低湿度+强风，火势蔓延迅速',
    params: {
      humidity: 10,
      windStrength: 0.9,
      spreadRate: 0.6,
    },
  },
  'wet-calm': {
    name: '湿润无风',
    description: '高湿度+无风，火势难以蔓延',
    params: {
      humidity: 80,
      windStrength: 0.1,
      spreadRate: 0.2,
    },
  },
  'default': {
    name: '默认场景',
    description: '中等湿度和风力',
    params: DEFAULT_PARAMS,
  },
};

export const COLORS = {
  EMPTY: '#8B4513',
  TREE: '#228B22',
  FIRE: '#FF4500',
  FIRE_GLOW: '#FF6347',
  ASH: '#696969',
  FIREFIGHTER: '#1E90FF',
  FIREFIGHTER_GLOW: '#00BFFF',
  GRID_LINE: 'rgba(0,0,0,0.1)',
};

export const FIREFIGHTER_EXTINGUISH_RADIUS = 2;
export const FIREFIGHTER_EXTINGUISH_PROBABILITY = 0.8;
