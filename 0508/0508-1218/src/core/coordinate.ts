import type { SatPosition, LLA } from '@/types';
import { DEG2RAD, RAD2DEG, EARTH_RADIUS_KM, EARTH_FLATTENING, EARTH_ROTATION_RATE } from './constants';
import { dateToJD } from './sunlight';

export function temeToECEF(pos: SatPosition, gmst: number): { x: number; y: number; z: number } {
  const cosGmst = Math.cos(gmst);
  const sinGmst = Math.sin(gmst);
  return {
    x: cosGmst * pos.x + sinGmst * pos.y,
    y: -sinGmst * pos.x + cosGmst * pos.y,
    z: pos.z,
  };
}

export function ecefToLLA(x: number, y: number, z: number): LLA {
  const r = Math.sqrt(x * x + y * y);
  const e2 = 2 * EARTH_FLATTENING - EARTH_FLATTENING * EARTH_FLATTENING;
  let lon = Math.atan2(y, x) * RAD2DEG;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;

  let lat = Math.atan2(z, r * (1 - e2)) * RAD2DEG;
  let alt = 0;
  for (let i = 0; i < 10; i++) {
    const sinLat = Math.sin(lat * DEG2RAD);
    const N = EARTH_RADIUS_KM / Math.sqrt(1 - e2 * sinLat * sinLat);
    alt = r / Math.cos(lat * DEG2RAD) - N;
    lat = Math.atan2(z, r * (1 - e2 * N / (N + alt))) * RAD2DEG;
  }
  return { lat, lon, alt };
}

export function computeGMST(date: Date): number {
  const jd = dateToJD(date);
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst * DEG2RAD;
}

export function satPositionToLLA(pos: SatPosition, date: Date): LLA {
  const gmst = computeGMST(date);
  const ecef = temeToECEF(pos, gmst);
  return ecefToLLA(ecef.x, ecef.y, ecef.z);
}

export function llaToECEF(lla: LLA): { x: number; y: number; z: number } {
  const lat = lla.lat * DEG2RAD;
  const lon = lla.lon * DEG2RAD;
  const e2 = 2 * EARTH_FLATTENING - EARTH_FLATTENING * EARTH_FLATTENING;
  const sinLat = Math.sin(lat);
  const N = EARTH_RADIUS_KM / Math.sqrt(1 - e2 * sinLat * sinLat);
  return {
    x: (N + lla.alt) * Math.cos(lat) * Math.cos(lon),
    y: (N + lla.alt) * Math.cos(lat) * Math.sin(lon),
    z: (N * (1 - e2) + lla.alt) * sinLat,
  };
}

export function computeLookAngle(
  satPos: SatPosition,
  obsLat: number,
  obsLon: number,
  obsAlt: number,
  date: Date
): { azimuth: number; elevation: number; range: number } {
  const gmst = computeGMST(date);
  const satEcef = temeToECEF(satPos, gmst);
  const obsEcef = llaToECEF({ lat: obsLat, lon: obsLon, alt: obsAlt });

  const dx = satEcef.x - obsEcef.x;
  const dy = satEcef.y - obsEcef.y;
  const dz = satEcef.z - obsEcef.z;

  const range = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const latRad = obsLat * DEG2RAD;
  const lonRad = obsLon * DEG2RAD;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLon = Math.sin(lonRad);
  const cosLon = Math.cos(lonRad);

  const south = sinLat * cosLon * dx + sinLat * sinLon * dy - cosLat * dz;
  const east = -sinLon * dx + cosLon * dy;
  const zenith = cosLat * cosLon * dx + cosLat * sinLon * dy + sinLat * dz;

  let azimuth = Math.atan2(east, -south) * RAD2DEG;
  if (azimuth < 0) azimuth += 360;

  const elevation = Math.asin(zenith / range) * RAD2DEG;

  return { azimuth, elevation, range };
}
