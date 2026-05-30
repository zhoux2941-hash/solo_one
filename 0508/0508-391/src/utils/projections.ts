import type { ProjectionParams, ProjectedPoint, ProjectionType } from '../../shared/types';

const DEG_TO_RAD = Math.PI / 180;
const HOUR_TO_RAD = Math.PI / 12;
const MAX_FIELD_OF_VIEW = Math.PI * 0.85;
const EDGE_FADE_ANGLE = Math.PI * 0.1;

const normalizeAngle = (angle: number): number => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const compressEdge = (r: number, maxR: number, strength: number = 0.3): number => {
  const normalized = Math.min(r / maxR, 0.999);
  const compressed = normalized * (1 - strength * normalized * normalized);
  return compressed * maxR;
};

export const raDecToThetaPhi = (ra: number, dec: number): { theta: number; phi: number } => {
  const theta = normalizeAngle(ra * HOUR_TO_RAD);
  const phi = dec * DEG_TO_RAD;
  return { theta, phi };
};

export const projectStereographic = (
  ra: number,
  dec: number,
  params: Omit<ProjectionParams, 'type'>
): ProjectedPoint => {
  const { theta, phi } = raDecToThetaPhi(ra, dec);
  const { centerRa, centerDec, scale, rotation } = params;

  const centerTheta = centerRa * HOUR_TO_RAD;
  const centerPhi = centerDec * DEG_TO_RAD;
  const rotationRad = rotation * DEG_TO_RAD;

  const deltaTheta = normalizeAngle(theta - centerTheta);

  const sinCenterPhi = Math.sin(centerPhi);
  const cosCenterPhi = Math.cos(centerPhi);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const cosDeltaTheta = Math.cos(deltaTheta);
  const sinDeltaTheta = Math.sin(deltaTheta);

  const cosC = sinCenterPhi * sinPhi + cosCenterPhi * cosPhi * cosDeltaTheta;
  const angularDistance = Math.acos(Math.max(-1, Math.min(1, cosC)));

  if (angularDistance > MAX_FIELD_OF_VIEW) {
    return { x: 0, y: 0, visible: false };
  }

  const sinC = Math.sin(angularDistance);
  if (sinC < 0.001) {
    const alpha = 1 - smoothstep(MAX_FIELD_OF_VIEW - EDGE_FADE_ANGLE, MAX_FIELD_OF_VIEW, angularDistance);
    return { x: 0, y: 0, visible: true, alpha };
  }

  const rawK = 2 * scale / (1 + cosC);
  const rawR = rawK * sinC;

  const maxUncompressedR = 2 * scale / (1 + Math.cos(MAX_FIELD_OF_VIEW)) * Math.sin(MAX_FIELD_OF_VIEW);
  const compressedR = compressEdge(rawR, maxUncompressedR, 0.35);

  const directionK = compressedR / sinC;

  const xPrime = directionK * cosPhi * sinDeltaTheta;
  const yPrime = directionK * (cosCenterPhi * sinPhi - sinCenterPhi * cosPhi * cosDeltaTheta);

  const cosRot = Math.cos(rotationRad);
  const sinRot = Math.sin(rotationRad);

  const x = xPrime * cosRot - yPrime * sinRot;
  const y = xPrime * sinRot + yPrime * cosRot;

  const alpha = 1 - smoothstep(MAX_FIELD_OF_VIEW - EDGE_FADE_ANGLE, MAX_FIELD_OF_VIEW, angularDistance);

  return { x, y, visible: true, alpha };
};

export const projectEquidistant = (
  ra: number,
  dec: number,
  params: Omit<ProjectionParams, 'type'>
): ProjectedPoint => {
  const { theta, phi } = raDecToThetaPhi(ra, dec);
  const { centerRa, centerDec, scale, rotation } = params;

  const centerTheta = centerRa * HOUR_TO_RAD;
  const centerPhi = centerDec * DEG_TO_RAD;
  const rotationRad = rotation * DEG_TO_RAD;

  const deltaTheta = normalizeAngle(theta - centerTheta);

  const cosC = Math.sin(centerPhi) * Math.sin(phi) + Math.cos(centerPhi) * Math.cos(phi) * Math.cos(deltaTheta);
  const angularDistance = Math.acos(Math.max(-1, Math.min(1, cosC)));

  if (angularDistance > MAX_FIELD_OF_VIEW) {
    return { x: 0, y: 0, visible: false };
  }

  const r = scale * angularDistance;

  const sinC = Math.sin(angularDistance);
  if (sinC < 0.001) {
    const alpha = 1 - smoothstep(MAX_FIELD_OF_VIEW - EDGE_FADE_ANGLE, MAX_FIELD_OF_VIEW, angularDistance);
    return { x: 0, y: 0, visible: true, alpha };
  }

  const xPrime = r * (Math.cos(phi) * Math.sin(deltaTheta)) / sinC;
  const yPrime = r * (Math.cos(centerPhi) * Math.sin(phi) - Math.sin(centerPhi) * Math.cos(phi) * Math.cos(deltaTheta)) / sinC;

  const cosRot = Math.cos(rotationRad);
  const sinRot = Math.sin(rotationRad);

  const x = xPrime * cosRot - yPrime * sinRot;
  const y = xPrime * sinRot + yPrime * cosRot;

  const alpha = 1 - smoothstep(MAX_FIELD_OF_VIEW - EDGE_FADE_ANGLE, MAX_FIELD_OF_VIEW, angularDistance);

  return { x, y, visible: true, alpha };
};

export const projectMercator = (
  ra: number,
  dec: number,
  params: Omit<ProjectionParams, 'type'>
): ProjectedPoint => {
  const { theta, phi } = raDecToThetaPhi(ra, dec);
  const { centerRa, centerDec, scale, rotation } = params;

  const centerTheta = centerRa * HOUR_TO_RAD;
  const rotationRad = rotation * DEG_TO_RAD;

  const maxDec = 75 * DEG_TO_RAD;
  if (Math.abs(phi) > maxDec) {
    return { x: 0, y: 0, visible: false };
  }

  const deltaTheta = normalizeAngle(theta - centerTheta);

  const xPrime = scale * deltaTheta;
  const yPrime = scale * Math.log(Math.tan(Math.PI / 4 + phi / 2));

  const yOffset = -scale * Math.log(Math.tan(Math.PI / 4 + centerDec * DEG_TO_RAD / 2));
  const yPrimeCentered = yPrime + yOffset;

  const cosRot = Math.cos(rotationRad);
  const sinRot = Math.sin(rotationRad);

  const x = xPrime * cosRot - yPrimeCentered * sinRot;
  const y = xPrime * sinRot + yPrimeCentered * cosRot;

  const normalizedDec = Math.abs(phi) / maxDec;
  const normalizedRa = Math.abs(deltaTheta) / (Math.PI * 0.75);
  const maxDistance = Math.max(normalizedDec, normalizedRa);
  const alpha = 1 - smoothstep(0.7, 1.0, maxDistance);

  return { x, y, visible: alpha > 0.05, alpha: Math.max(0, alpha) };
};

export const project = (
  ra: number,
  dec: number,
  params: ProjectionParams
): ProjectedPoint => {
  const baseParams = {
    centerRa: params.centerRa,
    centerDec: params.centerDec,
    scale: params.scale,
    rotation: params.rotation,
  };

  switch (params.type) {
    case 'stereographic':
      return projectStereographic(ra, dec, baseParams);
    case 'equidistant':
      return projectEquidistant(ra, dec, baseParams);
    case 'mercator':
      return projectMercator(ra, dec, baseParams);
    default:
      return projectStereographic(ra, dec, baseParams);
  }
};

export const getProjectedStars = (
  stars: Array<{ id: number; ra: number; dec: number }>,
  params: ProjectionParams
): Map<number, ProjectedPoint> => {
  const result = new Map<number, ProjectedPoint>();
  for (const star of stars) {
    result.set(star.id, project(star.ra, star.dec, params));
  }
  return result;
};

export const magnitudeToRadius = (magnitude: number, baseScale: number = 1): number => {
  return Math.max(0.5, baseScale * Math.pow(1.6, -magnitude + 4));
};

export const generateGridPoints = (
  params: ProjectionParams,
  centerX: number,
  centerY: number
): {
  circles: Array<{ cx: number; cy: number; r: number }>;
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
} => {
  const circles: Array<{ cx: number; cy: number; r: number }> = [];
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  if (params.type === 'mercator') {
    for (let ra = 0; ra < 24; ra += 2) {
      const top = project(ra, 70, params);
      const bottom = project(ra, -70, params);
      if (top.visible && bottom.visible) {
        lines.push({
          x1: centerX + top.x,
          y1: centerY + top.y,
          x2: centerX + bottom.x,
          y2: centerY + bottom.y,
        });
      }
    }
    for (let dec = -60; dec <= 60; dec += 15) {
      const left = project(0, dec, params);
      const right = project(23.99, dec, params);
      if (left.visible && right.visible) {
        lines.push({
          x1: centerX + left.x,
          y1: centerY + left.y,
          x2: centerX + right.x,
          y2: centerY + right.y,
        });
      }
    }
  } else {
    const circleAngles = [30, 60, 90];
    for (const angle of circleAngles) {
      const dec = 90 - angle;
      const projected = project(0, dec, params);
      if (projected.visible) {
        circles.push({
          cx: centerX,
          cy: centerY,
          r: Math.sqrt(projected.x * projected.x + projected.y * projected.y),
        });
      }
    }

    for (let ra = 0; ra < 24; ra += 2) {
      const projected = project(ra, params.centerDec, params);
      if (projected.visible) {
        const maxDec = params.type === 'stereographic' ? -85 : 0;
        const projectedOuter = project(ra, maxDec, params);
        if (projectedOuter.visible) {
          lines.push({
            x1: centerX + projected.x * 0.1,
            y1: centerY + projected.y * 0.1,
            x2: centerX + projectedOuter.x,
            y2: centerY + projectedOuter.y,
          });
        }
      }
    }
  }

  return { circles, lines };
};

export const calculateOptimalScale = (
  stars: Array<{ ra: number; dec: number }>,
  params: Omit<ProjectionParams, 'scale'>,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 0.85
): number => {
  if (stars.length === 0) return 200;

  const testScale = 1000;
  const testParams = { ...params, scale: testScale };

  let maxDistance = 0;

  for (const star of stars) {
    const projected = project(star.ra, star.dec, testParams as ProjectionParams);
    if (projected.visible) {
      const distance = Math.sqrt(projected.x * projected.x + projected.y * projected.y);
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  if (maxDistance === 0) {
    for (let ra = 0; ra < 24; ra += 4) {
      for (let dec = -60; dec <= 80; dec += 30) {
        const projected = project(ra, dec, testParams as ProjectionParams);
        if (projected.visible) {
          const distance = Math.sqrt(projected.x * projected.x + projected.y * projected.y);
          maxDistance = Math.max(maxDistance, distance);
        }
      }
    }
  }

  if (maxDistance === 0) return 200;

  const minDimension = Math.min(canvasWidth, canvasHeight);
  const targetRadius = (minDimension / 2) * padding;

  return (targetRadius / maxDistance) * testScale;
};

export const getProjectionDefaultScale = (type: ProjectionType): number => {
  switch (type) {
    case 'stereographic':
      return 200;
    case 'equidistant':
      return 250;
    case 'mercator':
      return 180;
    default:
      return 200;
  }
};

export type { ProjectionType };
