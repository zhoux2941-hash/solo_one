export interface ChariotType {
  id: string;
  name: string;
  wheelDiameter: number;
  axleDistance: number;
  carriageWidth: number;
  weight: number;
  crewCount: number;
}

export interface HarnessPart {
  id: string;
  name: string;
  description: string;
  targetType: string;
  position: { x: number; y: number; z: number };
}

export interface HarnessType {
  id: string;
  name: string;
  pullForcePerHorse: number;
  efficiencyCoeff: number;
  breathCoeff: number;
  turnFlexBase: number;
}

export interface TerrainType {
  id: string;
  name: string;
  resistanceCoeff: number;
  description: string;
  groundColor: string;
}

export interface ForceVector {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  label: string;
}

export interface CalculationResult {
  totalPullForce: number;
  effectivePullForce: number;
  rollingResistance: number;
  netPullForce: number;
  harnessEfficiency: number;
  breathEfficiency: number;
  overallEfficiency: number;
  turnFlexScore: number;
  forceVectors: ForceVector[];
}

export interface HarnessPlacement {
  partId: string;
  correct: boolean;
}
