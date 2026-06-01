export type WaveformType = 'square' | 'triangle' | 'sawtooth';

export interface HarmonicData {
  n: number;
  amplitude: number;
  frequency: number;
  phase: number;
  color: string;
}

export interface WaveformData {
  x: number[];
  y: number[];
  harmonics: HarmonicData[];
  combined: number[];
}

export interface GibbsData {
  overshootPercent: number;
  theoreticalValue: number;
  peakValue: number;
  idealValue: number;
}

export interface FourierState {
  harmonicCount: number;
  waveformType: WaveformType;
  isPlaying: boolean;
  volume: number;
  showIndividualHarmonics: boolean;
  animationSpeed: number;
}
