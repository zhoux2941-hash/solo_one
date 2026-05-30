export interface ColorInfo {
  color: string;
  name: string;
  meaning: string;
}

export interface RoleType {
  id: string;
  name: string;
  description: string;
  mainColors: ColorInfo[];
  secondaryColors: ColorInfo[];
  accentColors: ColorInfo[];
}

export interface FillRegion {
  id: string;
  name: string;
  path: string;
}

export interface FaceTemplate {
  id: string;
  name: string;
  svg: string;
  regions: FillRegion[];
}

export interface ClassicCharacter {
  id: string;
  name: string;
  roleType: string;
  description: string;
  era: string;
  historicalBackground: string;
  faceTemplate: string;
  colorScheme: Record<string, string>;
}

export type RegionColors = Record<string, string>;
