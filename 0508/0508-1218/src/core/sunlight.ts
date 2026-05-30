import { DEG2RAD, RAD2DEG, EARTH_RADIUS_KM } from './constants';
import { SatelliteClass } from '@/types';

export function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  let jy = y;
  let jm = m;
  if (m <= 2) {
    jy = y - 1;
    jm = m + 12;
  }

  const A = Math.floor(jy / 100);
  const B = 2 - A + Math.floor(A / 4);
  const C = Math.floor(365.25 * (jy + 4716));
  const D = Math.floor(30.6001 * (jm + 1));

  return B + C + D + d + h / 24 - 1524.5;
}

export interface SunPosition {
  ra: number;
  dec: number;
  eclipticLon: number;
  eclipticLat: number;
  distance: number;
}

export function getSunPosition(date: Date): SunPosition {
  const jd = dateToJD(date);
  const T = (jd - 2451545.0) / 36525.0;

  const L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const g = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const gDeg = ((g % 360) + 360) % 360;

  const equationOfCenter = 1.914602 * Math.sin(gDeg * DEG2RAD) +
    0.019993 * Math.sin(2 * gDeg * DEG2RAD) +
    0.000289 * Math.sin(3 * gDeg * DEG2RAD);

  const trueAnomaly = gDeg + equationOfCenter;
  const radiusVector = 1.000001018 * (1 - 0.016708617 * Math.cos(gDeg * DEG2RAD));

  const lambda = ((L + equationOfCenter) % 360 + 360) % 360;

  const epsilonDeg = 23.43929111 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
  const epsilonRad = epsilonDeg * DEG2RAD;
  const lambdaRad = lambda * DEG2RAD;

  const sinLambda = Math.sin(lambdaRad);
  const cosLambda = Math.cos(lambdaRad);
  const cosEpsilon = Math.cos(epsilonRad);
  const sinEpsilon = Math.sin(epsilonRad);

  const alphaRad = Math.atan2(cosEpsilon * sinLambda, cosLambda);
  let alpha = alphaRad * RAD2DEG;
  if (alpha < 0) alpha += 360;
  if (alpha > 360) alpha -= 360;

  const deltaRad = Math.asin(sinEpsilon * sinLambda);
  const delta = deltaRad * RAD2DEG;

  return {
    ra: alpha,
    dec: delta,
    eclipticLon: lambda,
    eclipticLat: 0,
    distance: radiusVector * 149597870.7,
  };
}

export interface SunIllumination {
  isSunlit: boolean;
  shadowType: 'none' | 'penumbra' | 'umbra';
  shadowDepth: number;
  phaseAngle: number;
}

export function getSatelliteSunIllumination(
  satEcefX: number,
  satEcefY: number,
  satEcefZ: number,
  date: Date
): SunIllumination {
  const sun = getSunPosition(date);
  const sunLonRad = sun.eclipticLon * DEG2RAD;
  const SUN_RADIUS = 696000;
  const EARTH_RADIUS = EARTH_RADIUS_KM;

  const sunDirX = Math.cos(sunLonRad);
  const sunDirY = Math.sin(sunLonRad);
  const sunDirZ = 0;
  const sunDist = sun.distance;

  const earthCenterX = 0;
  const earthCenterY = 0;
  const earthCenterZ = 0;

  const ocx = earthCenterX - satEcefX;
  const ocy = earthCenterY - satEcefY;
  const ocz = earthCenterZ - satEcefZ;

  const ocLen = Math.sqrt(ocx * ocx + ocy * ocy + ocz * ocz);

  const dotProduct = ocx * sunDirX + ocy * sunDirY + ocz * sunDirZ;

  if (dotProduct < 0) {
    return {
      isSunlit: true,
      shadowType: 'none',
      shadowDepth: 0,
      phaseAngle: 0,
    };
  }

  const closestDistSq = ocLen * ocLen - dotProduct * dotProduct;
  const closestDist = Math.sqrt(Math.max(0, closestDistSq));

  const umbraAngle = Math.asin((SUN_RADIUS - EARTH_RADIUS) / sunDist);
  const penumbraAngle = Math.asin((SUN_RADIUS + EARTH_RADIUS) / sunDist);

  const umbraRadius = EARTH_RADIUS - dotProduct * Math.tan(umbraAngle);
  const penumbraRadius = EARTH_RADIUS + dotProduct * Math.tan(penumbraAngle);

  const sunSatX = sunDirX * sunDist - satEcefX;
  const sunSatY = sunDirY * sunDist - satEcefY;
  const sunSatZ = sunDirZ * sunDist - satEcefZ;
  const earthSatX = earthCenterX - satEcefX;
  const earthSatY = earthCenterY - satEcefY;
  const earthSatZ = earthCenterZ - satEcefZ;

  const sunSatLen = Math.sqrt(sunSatX * sunSatX + sunSatY * sunSatY + sunSatZ * sunSatZ);
  const earthSatLen = Math.sqrt(earthSatX * earthSatX + earthSatY * earthSatY + earthSatZ * earthSatZ);

  const phaseDot = (sunSatX * earthSatX + sunSatY * earthSatY + sunSatZ * earthSatZ) /
    (sunSatLen * earthSatLen);
  const phaseAngle = Math.acos(Math.max(-1, Math.min(1, phaseDot))) * RAD2DEG;

  if (closestDist < Math.max(0, umbraRadius)) {
    return {
      isSunlit: false,
      shadowType: 'umbra',
      shadowDepth: 1,
      phaseAngle,
    };
  } else if (closestDist < penumbraRadius) {
    const shadowDepth = closestDist > umbraRadius
      ? (penumbraRadius - closestDist) / (penumbraRadius - umbraRadius) * 0.5
      : 1;
    return {
      isSunlit: true,
      shadowType: 'penumbra',
      shadowDepth,
      phaseAngle,
    };
  }

  return {
    isSunlit: true,
    shadowType: 'none',
    shadowDepth: 0,
    phaseAngle,
  };
}

export interface ObserverTwilight {
  isNight: boolean;
  isAstronomicalTwilight: boolean;
  isNauticalTwilight: boolean;
  isCivilTwilight: boolean;
  sunAltitude: number;
}

export function getObserverTwilight(
  observerLat: number,
  observerLon: number,
  date: Date
): ObserverTwilight {
  const sun = getSunPosition(date);
  const jd = dateToJD(date);

  const UT = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  let LST = 100.46 + 0.985647 * (jd - 2451545.0) + 15 * UT + observerLon;
  LST = ((LST % 360) + 360) % 360;

  let ha = LST - sun.ra;
  ha = ((ha % 360) + 360) % 360;
  if (ha > 180) ha -= 360;

  const haRad = ha * DEG2RAD;
  const latRad = observerLat * DEG2RAD;
  const decRad = sun.dec * DEG2RAD;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);

  const sinAlt = sinLat * sinDec + cosLat * cosDec * Math.cos(haRad);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD2DEG;

  return {
    isNight: altitude < -18,
    isAstronomicalTwilight: altitude >= -18 && altitude < -12,
    isNauticalTwilight: altitude >= -12 && altitude < -6,
    isCivilTwilight: altitude >= -6 && altitude < 0,
    sunAltitude: altitude,
  };
}

export function getSunriseSunset(
  observerLat: number,
  observerLon: number,
  date: Date
): { sunrise: Date; sunset: Date; civilDawn: Date; civilDusk: Date } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  function getSunEvent(eventType: 'sunrise' | 'sunset' | 'dawn' | 'dusk', zenith: number): Date {
    const noonDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const sun = getSunPosition(noonDate);

    const latRad = observerLat * DEG2RAD;
    const decRad = sun.dec * DEG2RAD;
    const zenithRad = zenith * DEG2RAD;

    let cosHourAngle = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));
    cosHourAngle = Math.max(-1, Math.min(1, cosHourAngle));

    const hourAngle = Math.acos(cosHourAngle) * RAD2DEG;
    const solarNoon = 12 - observerLon / 15 - (sun.ra / 15 - 12);

    let eventHour = eventType === 'sunrise' || eventType === 'dawn'
      ? solarNoon - hourAngle / 15
      : solarNoon + hourAngle / 15;

    const eventDate = new Date(Date.UTC(year, month, day));
    eventDate.setUTCMinutes(eventHour * 60);
    return eventDate;
  }

  return {
    sunrise: getSunEvent('sunrise', 90.833),
    sunset: getSunEvent('sunset', 90.833),
    civilDawn: getSunEvent('dawn', 96),
    civilDusk: getSunEvent('dusk', 96),
  };
}

export interface MagnitudeParams {
  satelliteClass: SatelliteClass;
  crossSection: number;
  rangeKm: number;
  phaseAngle: number;
  shadowDepth: number;
}

export const MAGNITUDE_CONFIG: Record<SatelliteClass, {
  baseAlbedo: number;
  baseMag: number;
  phaseCurveFactor: number;
  specularReflect: number;
}> = {
  [SatelliteClass.ISS]: {
    baseAlbedo: 0.35,
    baseMag: -4.5,
    phaseCurveFactor: 0.015,
    specularReflect: 0.3,
  },
  [SatelliteClass.LARGE_SATELLITE]: {
    baseAlbedo: 0.25,
    baseMag: -1.0,
    phaseCurveFactor: 0.012,
    specularReflect: 0.15,
  },
  [SatelliteClass.NAVIGATION]: {
    baseAlbedo: 0.30,
    baseMag: 2.0,
    phaseCurveFactor: 0.010,
    specularReflect: 0.1,
  },
  [SatelliteClass.TELESCOPE]: {
    baseAlbedo: 0.15,
    baseMag: 1.5,
    phaseCurveFactor: 0.008,
    specularReflect: 0.05,
  },
  [SatelliteClass.COMMUNICATION]: {
    baseAlbedo: 0.35,
    baseMag: 2.5,
    phaseCurveFactor: 0.010,
    specularReflect: 0.2,
  },
  [SatelliteClass.WEATHER]: {
    baseAlbedo: 0.30,
    baseMag: 3.0,
    phaseCurveFactor: 0.010,
    specularReflect: 0.1,
  },
  [SatelliteClass.SMALL_SATELLITE]: {
    baseAlbedo: 0.20,
    baseMag: 4.5,
    phaseCurveFactor: 0.008,
    specularReflect: 0.05,
  },
  [SatelliteClass.ROCKET_BODY]: {
    baseAlbedo: 0.25,
    baseMag: 3.5,
    phaseCurveFactor: 0.015,
    specularReflect: 0.1,
  },
};

export function calculateVisualMagnitude(params: MagnitudeParams): number {
  const { satelliteClass, crossSection, rangeKm, phaseAngle, shadowDepth } = params;
  const config = MAGNITUDE_CONFIG[satelliteClass] || MAGNITUDE_CONFIG[SatelliteClass.SMALL_SATELLITE];

  if (shadowDepth >= 0.9) {
    return 99;
  }

  const referenceRange = 400;
  const rangeFactor = Math.pow(rangeKm / referenceRange, 2);

  const phaseRad = phaseAngle * DEG2RAD;
  const phaseFactor = Math.exp(-config.phaseCurveFactor * phaseAngle) *
    (1 + config.specularReflect * Math.pow(Math.cos(phaseRad / 2), 8));

  const crossSectionFactor = Math.pow(crossSection / 100, 0.5);

  const shadowFactor = 1 - shadowDepth * 0.8;

  const magnitude = config.baseMag +
    2.5 * Math.log10(rangeFactor / (phaseFactor * crossSectionFactor * shadowFactor));

  return magnitude;
}

export function isPassVisible(
  illumination: SunIllumination,
  twilight: ObserverTwilight,
  maxElevation: number
): boolean {
  if (!illumination.isSunlit || illumination.shadowDepth > 0.7) {
    return false;
  }

  if (twilight.sunAltitude >= -6) {
    return false;
  }

  if (maxElevation < 10) {
    return false;
  }

  return true;
}
