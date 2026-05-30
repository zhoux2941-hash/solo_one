export type StructureType = 'outlet' | 'canal' | 'reservoir' | 'moat';

export type DescriptionCategory = 'open_ditch' | 'terrain' | 'defense';

export interface Point {
  x: number;
  y: number;
}

export interface City {
  id: string;
  name: string;
  pinyin: string;
  dynasty: string;
  era: string;
  year: string;
  area: number;
  population: string;
  description: string;
  outline: Point[];
  gates: Gate[];
}

export interface Gate {
  name: string;
  x: number;
  y: number;
  side: 'north' | 'south' | 'east' | 'west';
}

export interface DrainageStructure {
  id: string;
  cityId: string;
  type: StructureType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  path?: string;
  description: string;
  historicalNote?: string;
}

export interface DrainageDescription {
  id: string;
  cityId: string;
  category: DescriptionCategory;
  title: string;
  icon: string;
  content: string;
  features: string[];
}

export interface AppState {
  selectedCityId: string | null;
  compareMode: boolean;
  compareCityIds: string[];
  favorites: string[];
  activeHotspotId: string | null;
}

export interface AppActions {
  setSelectedCity: (cityId: string | null) => void;
  toggleCompareMode: () => void;
  addCompareCity: (cityId: string) => void;
  removeCompareCity: (cityId: string) => void;
  clearCompareCities: () => void;
  toggleFavorite: (cityId: string) => void;
  setActiveHotspot: (hotspotId: string | null) => void;
}

export type Store = AppState & AppActions;

export const STRUCTURE_LABELS: Record<StructureType, string> = {
  outlet: '出水口',
  canal: '排水渠',
  reservoir: '蓄水池',
  moat: '壕沟',
};

export const STRUCTURE_COLORS: Record<StructureType, string> = {
  outlet: '#8B4513',
  canal: '#4A90A4',
  reservoir: '#2E5A6B',
  moat: '#1E3A4A',
};

export const CATEGORY_LABELS: Record<DescriptionCategory, string> = {
  open_ditch: '明沟暗渠结合',
  terrain: '地势引水',
  defense: '排水与防御结合',
};
