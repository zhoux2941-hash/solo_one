import type { LLA, PassEvent, DayPasses, SatelliteInfo } from '@/types';
import { propagate } from './sgp4';
import { satPositionToLLA, computeLookAngle, temeToECEF, computeGMST } from './coordinate';
import type { SGP4Init } from './sgp4';
import { EARTH_RADIUS_KM } from './constants';
import { getSatelliteSunIllumination, getObserverTwilight, calculateVisualMagnitude, isPassVisible } from './sunlight';

const MIN_ELEVATION = 5;
const STEP_SECONDS = 30;

export function predictPasses(
  satrec: SGP4Init,
  epochDate: Date,
  observerLLA: LLA,
  satelliteInfo: SatelliteInfo,
  days: number = 7
): DayPasses[] {
  const result: DayPasses[] = [];
  const now = new Date();
  const startDate = new Date(now.getTime());

  for (let d = 0; d < days; d++) {
    const dayStart = new Date(startDate.getTime() + d * 86400000);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dateStr = dayStart.toISOString().split('T')[0];
    const passes: PassEvent[] = [];

    let inPass = false;
    let passStart: Date | null = null;
    let maxEl = -90;
    let maxElTime: Date | null = null;
    let startAz = 0;
    let maxAz = 0;
    let maxRange = 0;
    let maxPhaseAngle = 0;
    let maxShadowDepth = 0;
    let bestIllumination = null as null as any;
    let bestTwilight = null as null as any;

    const t = new Date(dayStart.getTime());
    while (t.getTime() < dayEnd.getTime()) {
      const tsince = (t.getTime() - epochDate.getTime()) / 60000;
      const pos = propagate(satrec, tsince);

      if (pos.x === 0 && pos.y === 0 && pos.z === 0) {
        t.setSeconds(t.getSeconds() + STEP_SECONDS);
        continue;
      }

      const gmst = computeGMST(t);
      const ecef = temeToECEF(pos, gmst);

      const look = computeLookAngle(pos, observerLLA.lat, observerLLA.lon, observerLLA.alt, t);
      const illumination = getSatelliteSunIllumination(ecef.x, ecef.y, ecef.z, t);
      const twilight = getObserverTwilight(observerLLA.lat, observerLLA.lon, t);

      if (look.elevation > MIN_ELEVATION) {
        if (!inPass) {
          inPass = true;
          passStart = new Date(t.getTime());
          startAz = look.azimuth;
          maxPhaseAngle = 0;
          maxShadowDepth = 0;
          bestIllumination = illumination;
          bestTwilight = twilight;
        }
        if (look.elevation > maxEl) {
          maxEl = look.elevation;
          maxElTime = new Date(t.getTime());
          maxAz = look.azimuth;
          maxRange = look.range;
          maxPhaseAngle = illumination.phaseAngle;
          maxShadowDepth = illumination.shadowDepth;
          bestIllumination = illumination;
          bestTwilight = twilight;
        }
      } else if (inPass) {
        if (passStart && maxElTime && bestIllumination && bestTwilight) {
          const visible = isPassVisible(bestIllumination, bestTwilight, maxEl);
          const magnitude = calculateVisualMagnitude({
            satelliteClass: satelliteInfo.satelliteClass,
            crossSection: satelliteInfo.crossSection,
            rangeKm: maxRange,
            phaseAngle: maxPhaseAngle,
            shadowDepth: maxShadowDepth,
          });
          passes.push({
            startTime: passStart,
            endTime: new Date(t.getTime()),
            maxElTime,
            maxElevation: maxEl,
            startAz,
            endAz: look.azimuth,
            maxAz,
            magnitude,
            isVisible: visible,
            maxRange,
          });
        }
        inPass = false;
        maxEl = -90;
        passStart = null;
        maxElTime = null;
        maxRange = 0;
        maxPhaseAngle = 0;
        maxShadowDepth = 0;
        bestIllumination = null;
        bestTwilight = null;
      }

      t.setSeconds(t.getSeconds() + STEP_SECONDS);
    }

    if (inPass && passStart && maxElTime && bestIllumination && bestTwilight) {
      const visible = isPassVisible(bestIllumination, bestTwilight, maxEl);
      const magnitude = calculateVisualMagnitude({
        satelliteClass: satelliteInfo.satelliteClass,
        crossSection: satelliteInfo.crossSection,
        rangeKm: maxRange,
        phaseAngle: maxPhaseAngle,
        shadowDepth: maxShadowDepth,
      });
      passes.push({
        startTime: passStart,
        endTime: new Date(t.getTime()),
        maxElTime,
        maxElevation: maxEl,
        startAz,
        endAz: 0,
        maxAz,
        magnitude,
        isVisible: visible,
        maxRange,
      });
    }

    result.push({ date: dateStr, passes });
  }

  return result;
}

export function getOrbitPoints(
  satrec: SGP4Init,
  epochDate: Date,
  refDate: Date,
  numPoints: number = 200
): { x: number; y: number; z: number; lla: LLA }[] {
  const period = 2 * Math.PI / satrec.no;
  const points: { x: number; y: number; z: number; lla: LLA }[] = [];

  const tsinceRef = (refDate.getTime() - epochDate.getTime()) / 60000;

  for (let i = 0; i < numPoints; i++) {
    const tsince = tsinceRef + (i / numPoints) * period;
    const pos = propagate(satrec, tsince);
    const lla = satPositionToLLA(pos, new Date(refDate.getTime() + ((i / numPoints) * period) * 60000));
    const r = (EARTH_RADIUS_KM + lla.alt) / EARTH_RADIUS_KM;
    points.push({
      x: r * Math.cos(lla.lat * Math.PI / 180) * Math.cos(lla.lon * Math.PI / 180),
      y: r * Math.cos(lla.lat * Math.PI / 180) * Math.sin(lla.lon * Math.PI / 180),
      z: r * Math.sin(lla.lat * Math.PI / 180),
      lla,
    });
  }

  return points;
}
