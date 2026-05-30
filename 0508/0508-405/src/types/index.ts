export type ParkType = 'comprehensive' | 'community' | 'specialized' | 'garden';

export interface District {
  id: string;
  name: string;
  color: string;
  boundary: string;
}

export interface Park {
  id: string;
  name: string;
  area: number;
  type: ParkType;
  facilities: string[];
  openTime: string;
  x: number;
  y: number;
  districtId: string;
}

export interface Address {
  name: string;
  x: number;
  y: number;
}

export interface WalkabilityResult {
  park: Park;
  distance: number;
  walkTime: number;
}

export interface Favorite {
  parkId: string;
  createdAt: number;
}

export const PARK_TYPE_LABELS: Record<ParkType, string> = {
  comprehensive: '综合公园',
  community: '社区公园',
  specialized: '专类公园',
  garden: '游园',
};

export const PARK_TYPE_COLORS: Record<ParkType, string> = {
  comprehensive: '#2D5A27',
  community: '#4A90D9',
  specialized: '#E67E22',
  garden: '#9B59B6',
};
