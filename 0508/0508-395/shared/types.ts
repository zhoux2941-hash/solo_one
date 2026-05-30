export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface XYZ {
  X: number;
  Y: number;
  Z: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface PantoneColor {
  id: number;
  pantoneCode: string;
  name: string;
  nameZh: string;
  rgb: RGB;
  cmyk: CMYK;
  lab: Lab;
  hex: string;
  category: string;
  description?: string;
}

export interface ColorConversionResult {
  rgb: RGB;
  cmyk: CMYK;
  lab: Lab;
  xyz: XYZ;
  hsl: HSL;
  hex: string;
  pantoneMatch: PantoneColor | null;
}

export interface DeltaEResult {
  deltaE2000: number;
  difference: string;
  lab1: Lab;
  lab2: Lab;
}

export interface OverprintResult {
  color1: PantoneColor;
  color2: PantoneColor;
  opacity1: number;
  opacity2: number;
  mixedRGB: RGB;
  mixedHex: string;
  mixedCMYK: CMYK;
  mixedLab: Lab;
}

export interface ColorReportData {
  colors: PantoneColor[];
  title: string;
  application: string;
  notes: string;
  generatedAt: string;
}

export type InputMode = 'rgb' | 'cmyk' | 'pantone' | 'hex';
