export interface SatelliteInfo {
  id: string;
  name: string;
  nameCn: string;
  noradId: number;
  type: string;
  typeCn: string;
  magnitude: number;
  country: string;
  tle1: string;
  tle2: string;
  satelliteClass: SatelliteClass;
  crossSection: number;
}

export enum SatelliteClass {
  ISS = 'iss',
  LARGE_SATELLITE = 'large',
  SMALL_SATELLITE = 'small',
  ROCKET_BODY = 'rocket',
  TELESCOPE = 'telescope',
  NAVIGATION = 'navigation',
  COMMUNICATION = 'communication',
  WEATHER = 'weather',
}

export interface TLEData {
  line1: string;
  line2: string;
  satNum: number;
  epochYear: number;
  epochDay: number;
  inclination: number;
  raan: number;
  eccentricity: number;
  argPerigee: number;
  meanAnomaly: number;
  meanMotion: number;
  bstar: number;
}

export interface SatPosition {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface LLA {
  lat: number;
  lon: number;
  alt: number;
}

export interface PassEvent {
  startTime: Date;
  endTime: Date;
  maxElTime: Date;
  maxElevation: number;
  startAz: number;
  endAz: number;
  maxAz: number;
  magnitude: number;
  isVisible: boolean;
  maxRange: number;
}

export interface DayPasses {
  date: string;
  passes: PassEvent[];
}

export interface UserLocation {
  lat: number;
  lon: number;
  alt: number;
  name?: string;
}
