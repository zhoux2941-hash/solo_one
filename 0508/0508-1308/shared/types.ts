export interface Role {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface Character {
  id: number;
  roleId: number;
  name: string;
  alias: string;
  description: string;
}

export type ShapeLayer = 'base' | 'line' | 'feature';

export interface Shape {
  type: 'path' | 'circle' | 'ellipse' | 'rect' | 'polygon';
  points: number[];
  color: 'main' | 'secondary' | 'outline' | 'accent1' | 'accent2';
  fill: boolean;
  strokeWidth: number;
  layer?: ShapeLayer;
}

export interface SichuanOpera {
  id: number;
  name: string;
  alias?: string;
  description: string;
  plotSummary: string;
  historicalBackground?: string;
  culturalSignificance?: string;
}

export interface FacePattern {
  id: number;
  characterId: number;
  patternType: 'symmetric' | 'asymmetric';
  mainColor: string;
  secondaryColor: string;
  outlineColor: string;
  accentColor1: string;
  accentColor2: string;
  patternFeatures: string;
  patternShapes: Shape[];
  referenceImage: string | null;
  relatedOperas: SichuanOpera[];
}

export interface ColorPalette {
  main: string;
  secondary: string;
  outline: string;
  accent1: string;
  accent2: string;
}

export interface FacePatternExport {
  version: string;
  exportedAt: string;
  characterName: string;
  patternType: 'symmetric' | 'asymmetric';
  colors: ColorPalette;
  layers: {
    base: Shape[];
    line: Shape[];
    feature: Shape[];
  };
  metadata: {
    patternFeatures: string;
  };
}

export interface ColorSymbolism {
  id: number;
  color: string;
  hex: string;
  meaning: string;
  examples: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
