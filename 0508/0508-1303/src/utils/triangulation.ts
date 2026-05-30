import { TriangulationResult, StationPosition, StationAnnotation } from '../types';

const VS_KM_S = 8;
const VP_KM_S = 6;

export function calculateDistanceFromPSDiff(psDiff: number): number {
  return psDiff * VS_KM_S * VP_KM_S / (VS_KM_S - VP_KM_S);
}

function circleCircleIntersection(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): { x: number; y: number }[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r1 + r2) return [];
  if (d < Math.abs(r1 - r2)) return [];
  if (d === 0 && r1 === r2) return [];

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const px = x1 + a * dx / d;
  const py = y1 + a * dy / d;

  return [
    { x: px + h * dy / d, y: py - h * dx / d },
    { x: px - h * dy / d, y: py + h * dx / d }
  ];
}

export function triangulate(
  stations: StationPosition[],
  annotations: Record<string, StationAnnotation>
): TriangulationResult | null {
  const validStations = stations.filter(s => {
    const ann = annotations[s.id];
    return ann && ann.pTime !== null && ann.sTime !== null;
  });

  if (validStations.length < 2) return null;

  const stationData = validStations.map(s => {
    const ann = annotations[s.id];
    const psDiff = Math.abs((ann?.sTime || 0) - (ann?.pTime || 0));
    const distance = calculateDistanceFromPSDiff(psDiff);
    return { station: s, distance, pTime: ann!.pTime, sTime: ann!.sTime, psDiff };
  });

  const allIntersections: { x: number; y: number }[] = [];

  for (let i = 0; i < stationData.length; i++) {
    for (let j = i + 1; j < stationData.length; j++) {
      const s1 = stationData[i];
      const s2 = stationData[j];
      const intersections = circleCircleIntersection(
        s1.station.x, s1.station.y, s1.distance,
        s2.station.x, s2.station.y, s2.distance
      );
      allIntersections.push(...intersections);
    }
  }

  if (allIntersections.length === 0) {
    const avgX = stationData.reduce((sum, s) => sum + s.station.x, 0) / stationData.length;
    const avgY = stationData.reduce((sum, s) => sum + s.station.y, 0) / stationData.length;
    return buildResult(avgX, avgY, stationData, []);
  }

  let bestX = 0;
  let bestY = 0;
  let minTotalDist = Infinity;

  for (const point of allIntersections) {
    const totalDist = stationData.reduce((sum, s) => {
      const dx = point.x - s.station.x;
      const dy = point.y - s.station.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return sum + Math.abs(dist - s.distance);
    }, 0);

    if (totalDist < minTotalDist) {
      minTotalDist = totalDist;
      bestX = point.x;
      bestY = point.y;
    }
  }

  const avgStationX = stationData.reduce((sum, s) => sum + s.station.x, 0) / stationData.length;
  const avgStationY = stationData.reduce((sum, s) => sum + s.station.y, 0) / stationData.length;

  const refinedX = (bestX * 2 + avgStationX) / 3;
  const refinedY = (bestY * 2 + avgStationY) / 3;

  return buildResult(refinedX, refinedY, stationData, allIntersections);
}

function buildResult(
  x: number,
  y: number,
  stationData: { station: StationPosition; distance: number; pTime: number | null; sTime: number | null; psDiff: number | null }[],
  intersections: { x: number; y: number }[]
): TriangulationResult {
  const avgDist = stationData.reduce((sum, s) => {
    const dx = x - s.station.x;
    const dy = y - s.station.y;
    return sum + Math.abs(Math.sqrt(dx * dx + dy * dy) - s.distance);
  }, 0) / stationData.length;

  const maxDist = Math.max(...stationData.map(s => s.distance));
  const confidence = maxDist > 0 ? Math.max(0, Math.min(100, (1 - avgDist / maxDist) * 100)) : 0;

  const refStation = stationData[0]?.station;
  const latOffset = y / 111;
  const lonOffset = refStation ? x / (111 * Math.cos((refStation.lat * Math.PI) / 180)) : x / 111;

  return {
    epicenterX: x,
    epicenterY: y,
    lat: (refStation?.lat || 30) + latOffset,
    lon: (refStation?.lon || 100) + lonOffset,
    stations: stationData.map(s => ({
      id: s.station.id,
      name: s.station.name,
      distance: s.distance,
      pTime: s.pTime,
      sTime: s.sTime,
      psDiff: s.psDiff
    })),
    confidence: Math.round(confidence),
    circleIntersections: intersections
  };
}

export function xyToLatLon(x: number, y: number, refLat: number, refLon: number): { lat: number; lon: number } {
  return {
    lat: refLat + y / 111,
    lon: refLon + x / (111 * Math.cos((refLat * Math.PI) / 180))
  };
}
