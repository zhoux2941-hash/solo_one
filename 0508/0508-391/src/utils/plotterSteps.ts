import type { Star, Constellation, Connection, ProjectionParams, DrawingStep } from '../../shared/types';
import { project, magnitudeToRadius, generateGridPoints } from './projections';
import { CONSTELLATION_COLORS } from '../../shared/types';

export const generatePlotterSteps = (
  stars: Star[],
  constellations: Constellation[],
  connections: Connection[],
  params: ProjectionParams,
  centerX: number,
  centerY: number
): DrawingStep[] => {
  const steps: DrawingStep[] = [];

  const grid = generateGridPoints(params, centerX, centerY);

  for (const circle of grid.circles) {
    steps.push({
      type: 'circle',
      progress: 0,
      data: {
        cx: circle.cx,
        cy: circle.cy,
        r: circle.r,
        startAngle: 0,
        endAngle: Math.PI * 2,
        color: '#2e5eaa',
      },
    });
  }

  for (const line of grid.lines) {
    steps.push({
      type: 'line',
      progress: 0,
      data: {
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        color: '#2e5eaa',
      },
    });
  }

  const constellationMap = new Map(constellations.map((c) => [c.id, c]));

  const visibleStars = stars
    .map((star) => ({
      ...star,
      projected: project(star.ra, star.dec, params),
    }))
    .filter((s) => s.projected.visible)
    .sort((a, b) => a.magnitude - b.magnitude);

  for (const star of visibleStars) {
    const x = centerX + star.projected.x;
    const y = centerY + star.projected.y;
    const r = magnitudeToRadius(star.magnitude, 1.5);

    steps.push({
      type: 'point',
      progress: 0,
      data: {
        px: x,
        py: y,
        r,
        color: '#f5f0e6',
      },
    });

    if (star.magnitude <= 3) {
      steps.push({
        type: 'text',
        progress: 0,
        data: {
          px: x + r + 6,
          py: y + 4,
          text: star.name,
          fontSize: 10,
          color: '#d4c5a9',
        },
      });
    }
  }

  for (const conn of connections) {
    const constellation = constellationMap.get(conn.constellationId);
    if (!constellation) continue;

    const fromStar = visibleStars.find((s) => s.id === conn.fromStarId);
    const toStar = visibleStars.find((s) => s.id === conn.toStarId);

    if (!fromStar || !toStar) continue;

    const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';
    const x1 = centerX + fromStar.projected.x;
    const y1 = centerY + fromStar.projected.y;
    const x2 = centerX + toStar.projected.x;
    const y2 = centerY + toStar.projected.y;

    steps.push({
      type: 'line',
      progress: 0,
      data: {
        x1,
        y1,
        x2,
        y2,
        color,
      },
    });
  }

  for (const constellation of constellations) {
    const constellationStars = visibleStars.filter(
      (s) => s.constellationId === constellation.id,
    );
    if (constellationStars.length === 0) continue;

    const avgX =
      constellationStars.reduce((sum, s) => sum + s.projected.x, 0) /
      constellationStars.length;
    const avgY =
      constellationStars.reduce((sum, s) => sum + s.projected.y, 0) /
      constellationStars.length;

    const x = centerX + avgX;
    const y = centerY + avgY - 15;
    const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';

    steps.push({
      type: 'text',
      progress: 0,
      data: {
        px: x,
        py: y,
        text: constellation.name,
        fontSize: 16,
        color,
      },
    });
  }

  return steps;
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export const getCurrentStepIndex = (progress: number, totalSteps: number): number => {
  const easedProgress = easeInOutQuad(progress);
  return Math.min(Math.floor(easedProgress * totalSteps), totalSteps - 1);
};

export const getStepProgress = (progress: number, totalSteps: number): number => {
  const easedProgress = easeInOutQuad(progress);
  const stepProgress = easedProgress * totalSteps;
  return stepProgress - Math.floor(stepProgress);
};
