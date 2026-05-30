export enum CellState {
  EMPTY = 0,
  TREE = 1,
  FIRE = 2,
  ASH = 3,
  FIREFIGHTER = 4,
}

export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface WindVector {
  dx: number;
  dy: number;
  name: WindDirection;
  label: string;
}

export interface SimulationParams {
  treeDensity: number;
  humidity: number;
  windDirection: WindDirection;
  windStrength: number;
  spreadRate: number;
  burnDuration: number;
}

export interface SimulationStats {
  totalTrees: number;
  burningTrees: number;
  burnedTrees: number;
  burnedArea: number;
  survivalRate: number;
  timeStep: number;
  firefighterCount: number;
}

export interface CellData {
  x: number;
  y: number;
  state: CellState;
  burnTime: number;
}

export type PresetScene = 'dry-windy' | 'wet-calm' | 'default';

export interface PresetConfig {
  name: string;
  description: string;
  params: Partial<SimulationParams>;
}
