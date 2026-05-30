export interface LissajousParams {
  fx: number;
  fy: number;
  phase: number;
  amplitude: number;
}

export interface Point {
  x: number;
  y: number;
  t: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  t: number;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  params: LissajousParams;
  description: string;
}

export interface FrequencyRatio {
  x: number;
  y: number;
  string: string;
}

export interface DrawingOptions {
  showGrid: boolean;
  showAxes: boolean;
  lineWidth: number;
  glowEffect: boolean;
}

export interface TracerOptions {
  enabled: boolean;
  trailLength: number;
  pointSize: number;
}

export interface WaveformOptions {
  show: boolean;
  width: number;
  height: number;
}

export interface View3DOptions {
  enabled: boolean;
  tubeRadius: number;
  showAxes3D: boolean;
  showGrid3D: boolean;
  autoRotate: boolean;
  depthScale: number;
}

export type ViewMode = '2d' | '3d'
