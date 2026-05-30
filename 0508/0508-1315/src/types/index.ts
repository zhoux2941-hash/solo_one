export type AromaType = 'woody' | 'spicy' | 'fresh' | 'sweet' | 'musk';

export type Temperature = 'cool' | 'neutral' | 'warm';

export type AromaCategory = '清雅' | '浓郁' | '温润' | '清冽' | '醇厚' | '淡雅';

export interface Spice {
  id: string;
  name: string;
  alias: string;
  aromaType: AromaType;
  intensity: number;
  duration: number;
  temperature: Temperature;
  description: string;
  icon: string;
}

export interface SelectedSpice {
  spice: Spice;
  grams: number;
}

export interface FormulaAnalysis {
  totalWeight: number;
  aromaType: AromaCategory;
  topNote: string;
  middleNote: string;
  baseNote: string;
  overallScore: number;
  suggestion: string;
  attributes: {
    woody: number;
    spicy: number;
    fresh: number;
    sweet: number;
    musk: number;
  };
}

export interface AshParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetY: number;
  settled: boolean;
}

export interface IncenseState {
  temperature: number;
  releaseRate: number;
  burnTime: number;
  ashColor: { r: number; g: number; b: number };
  isBurning: boolean;
  ashParticles: AshParticle[];
  grindLevel: number;
}

export interface ClassicFormula {
  id: string;
  name: string;
  origin: string;
  era: string;
  ingredients: { spiceId: string; grams: number }[];
  description: string;
  story: string;
}
