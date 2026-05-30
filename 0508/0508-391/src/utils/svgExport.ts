import type { Star, Constellation, Connection, ProjectionParams } from '../../shared/types';
import { project, magnitudeToRadius, generateGridPoints } from './projections';
import { CONSTELLATION_COLORS } from '../../shared/types';

export const generateSVG = (
  stars: Star[],
  constellations: Constellation[],
  connections: Connection[],
  params: ProjectionParams,
  width: number = 1200,
  height: number = 1200
): string => {
  const centerX = width / 2;
  const centerY = height / 2;

  const projectedStars = stars.map((star) => ({
    ...star,
    projected: project(star.ra, star.dec, params),
  }));

  const grid = generateGridPoints(params, centerX, centerY);

  const visibleStars = projectedStars.filter((s) => s.projected.visible && (s.projected.alpha ?? 1) > 0.05);

  const constellationMap = new Map(constellations.map((c) => [c.id, c]));

  const svgParts: string[] = [];

  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );

  svgParts.push(`
  <defs>
    <radialGradient id="skyGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#0a1628;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#050a12;stop-opacity:1" />
    </radialGradient>
    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="starGlowBright" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  `);

  svgParts.push(`<rect width="${width}" height="${height}" fill="url(#skyGradient)"/>`);

  svgParts.push(`<g id="grid" stroke="#2e5eaa" stroke-width="0.5" opacity="0.3" fill="none">`);
  for (const circle of grid.circles) {
    svgParts.push(`  <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/>`);
  }
  for (const line of grid.lines) {
    svgParts.push(`  <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}"/>`);
  }
  svgParts.push(`</g>`);

  svgParts.push(`<g id="constellation-lines" fill="none" stroke-width="1.2">`);
  for (const conn of connections) {
    const constellation = constellationMap.get(conn.constellationId);
    if (!constellation) continue;

    const fromStar = projectedStars.find((s) => s.id === conn.fromStarId);
    const toStar = projectedStars.find((s) => s.id === conn.toStarId);

    if (!fromStar || !toStar || !fromStar.projected.visible || !toStar.projected.visible) continue;

    const fromAlpha = fromStar.projected.alpha ?? 1;
    const toAlpha = toStar.projected.alpha ?? 1;
    const lineAlpha = Math.min(fromAlpha, toAlpha) * 0.7;

    if (lineAlpha < 0.05) continue;

    const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';
    const x1 = centerX + fromStar.projected.x;
    const y1 = centerY + fromStar.projected.y;
    const x2 = centerX + toStar.projected.x;
    const y2 = centerY + toStar.projected.y;

    svgParts.push(
      `  <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" opacity="${lineAlpha.toFixed(2)}"/>`
    );
  }
  svgParts.push(`</g>`);

  svgParts.push(`<g id="stars">`);
  for (const star of visibleStars) {
    const x = centerX + star.projected.x;
    const y = centerY + star.projected.y;
    const r = magnitudeToRadius(star.magnitude, 1.2);
    const alpha = star.projected.alpha ?? 1;
    const filter = star.magnitude <= 2 ? 'filter="url(#starGlowBright)"' : 'filter="url(#starGlow)"';

    svgParts.push(
      `  <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="#f5f0e6" opacity="${alpha.toFixed(2)}" ${filter}/>`
    );

    if (star.magnitude <= 3 && alpha > 0.3) {
      const textOffset = r + 6;
      const textAlpha = Math.min(0.8, alpha);
      svgParts.push(
        `  <text x="${(x + textOffset).toFixed(2)}" y="${(y + 4).toFixed(2)}" font-family="Noto Serif SC, serif" font-size="10" fill="#d4c5a9" opacity="${textAlpha.toFixed(2)}">${star.name}</text>`
      );
    }
  }
  svgParts.push(`</g>`);

  svgParts.push(`<g id="constellation-labels">`);
  for (const constellation of constellations) {
    const constellationStars = visibleStars.filter(
      (s) => s.constellationId === constellation.id
    );
    if (constellationStars.length === 0) continue;

    const minAlpha = Math.min(...constellationStars.map(s => s.projected.alpha ?? 1));
    if (minAlpha < 0.3) continue;

    const avgX =
      constellationStars.reduce((sum, s) => sum + s.projected.x, 0) / constellationStars.length;
    const avgY =
      constellationStars.reduce((sum, s) => sum + s.projected.y, 0) / constellationStars.length;

    const x = centerX + avgX;
    const y = centerY + avgY - 15;
    const color = CONSTELLATION_COLORS[constellation.type] || '#8b7355';

    svgParts.push(
      `  <text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="Noto Serif SC, serif" font-size="14" font-weight="bold" text-anchor="middle" fill="${color}" opacity="${minAlpha.toFixed(2)}">${constellation.name}</text>`
    );
  }
  svgParts.push(`</g>`);

  svgParts.push(`
  <g id="title" transform="translate(${width / 2}, 50)">
    <text x="0" y="0" font-family="Noto Serif SC, serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#f5f0e6">仪象考成 · 星图</text>
    <text x="0" y="30" font-family="Noto Serif SC, serif" font-size="14" text-anchor="middle" fill="#8b7355">${
      params.type === 'stereographic'
        ? '球极投影'
        : params.type === 'equidistant'
        ? '等距投影'
        : '墨卡托投影'
    } · 中心赤经 ${params.centerRa.toFixed(1)}h · 中心赤纬 ${params.centerDec.toFixed(1)}°</text>
  </g>
  `);

  svgParts.push(`
  <g id="seal" transform="translate(${width - 80}, ${height - 80})">
    <circle cx="40" cy="40" r="36" fill="none" stroke="#c41e3a" stroke-width="2"/>
    <text x="40" y="48" font-family="Noto Serif SC, serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#c41e3a">仪象考成</text>
  </g>
  `);

  svgParts.push(`</svg>`);

  return svgParts.join('\n');
};

export const downloadSVG = (
  stars: Star[],
  constellations: Constellation[],
  connections: Connection[],
  params: ProjectionParams,
  filename: string = '星图.svg'
): void => {
  const svgContent = generateSVG(stars, constellations, connections, params);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
