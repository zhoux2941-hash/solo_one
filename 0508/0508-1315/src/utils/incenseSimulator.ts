import { AshParticle } from '../types';

interface ColorStop {
  r: number;
  g: number;
  b: number;
  a: number;
  pos: number;
}

interface TempColorRange {
  temp: number;
  centerColor: { r: number; g: number; b: number };
  midColor: { r: number; g: number; b: number };
  edgeColor: { r: number; g: number; b: number };
}

const TEMP_COLOR_MAP: TempColorRange[] = [
  {
    temp: 120,
    centerColor: { r: 185, g: 180, b: 175 },
    midColor: { r: 195, g: 192, b: 188 },
    edgeColor: { r: 210, g: 208, b: 205 },
  },
  {
    temp: 140,
    centerColor: { r: 165, g: 155, b: 145 },
    midColor: { r: 185, g: 178, b: 170 },
    edgeColor: { r: 205, g: 200, b: 195 },
  },
  {
    temp: 160,
    centerColor: { r: 130, g: 115, b: 95 },
    midColor: { r: 160, g: 148, b: 132 },
    edgeColor: { r: 195, g: 188, b: 178 },
  },
  {
    temp: 180,
    centerColor: { r: 90, g: 72, b: 50 },
    midColor: { r: 130, g: 112, b: 92 },
    edgeColor: { r: 180, g: 168, b: 152 },
  },
  {
    temp: 200,
    centerColor: { r: 55, g: 40, b: 22 },
    midColor: { r: 100, g: 82, b: 60 },
    edgeColor: { r: 160, g: 145, b: 125 },
  },
];

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function getColorRangeForTemp(temp: number): TempColorRange {
  const clampedTemp = Math.max(120, Math.min(200, temp));

  let lower = TEMP_COLOR_MAP[0];
  let upper = TEMP_COLOR_MAP[TEMP_COLOR_MAP.length - 1];

  for (let i = 0; i < TEMP_COLOR_MAP.length - 1; i++) {
    if (clampedTemp >= TEMP_COLOR_MAP[i].temp && clampedTemp <= TEMP_COLOR_MAP[i + 1].temp) {
      lower = TEMP_COLOR_MAP[i];
      upper = TEMP_COLOR_MAP[i + 1];
      break;
    }
  }

  const t = (clampedTemp - lower.temp) / (upper.temp - lower.temp || 1);

  return {
    temp: clampedTemp,
    centerColor: lerpColor(lower.centerColor, upper.centerColor, t),
    midColor: lerpColor(lower.midColor, upper.midColor, t),
    edgeColor: lerpColor(lower.edgeColor, upper.edgeColor, t),
  };
}

export function calculateReleaseRate(temp: number, grindLevel: number = 5): number {
  const grindFactor = 0.7 + (grindLevel / 10) * 0.6;

  let baseRate: number;
  if (temp < 120) {
    baseRate = Math.max(0, temp * 0.08);
  } else if (temp <= 165) {
    baseRate = 40 + (temp - 120) * 1.33;
  } else if (temp <= 180) {
    baseRate = 100 - (temp - 165) * 0.67;
  } else {
    baseRate = Math.max(20, 80 - (temp - 180) * 2);
  }

  return Math.min(100, Math.max(0, baseRate * grindFactor));
}

export function getGrindLabel(level: number): string {
  if (level <= 2) return '极粗粉';
  if (level <= 4) return '粗粉';
  if (level <= 6) return '中粉';
  if (level <= 8) return '细粉';
  return '极细粉';
}

export function getGrindDescription(level: number): string {
  if (level <= 2) return '颗粒较大，出香平缓持久，适合长时间熏燃';
  if (level <= 4) return '颗粒适中偏大，出香稳定，留香时间长';
  if (level <= 6) return '标准研磨度，香气均衡，适应性广';
  if (level <= 8) return '颗粒细腻，出香迅速，香气浓郁';
  return '粉末极细，瞬间爆发香气，适合品鉴前调';
}

export function getAshColor(burnTime: number, temp: number): { r: number; g: number; b: number } {
  const range = getColorRangeForTemp(temp);
  const timeEffect = Math.min(1, burnTime / 120);
  const centerDarken = timeEffect * 0.3;
  return {
    r: Math.max(30, Math.round(range.centerColor.r - centerDarken * 60)),
    g: Math.max(20, Math.round(range.centerColor.g - centerDarken * 70)),
    b: Math.max(15, Math.round(range.centerColor.b - centerDarken * 80)),
  };
}

export function generateAshParticle(canvasWidth: number, burnTime: number, grindLevel: number = 5): AshParticle {
  const centerX = canvasWidth / 2;
  const spread = Math.min(60, 20 + burnTime * 0.15);
  const sizeFactor = 0.5 + (10 - grindLevel) / 10 * 2.5;

  return {
    x: centerX + (Math.random() - 0.5) * spread,
    y: 30 + Math.random() * 20,
    targetY: 80 + Math.random() * 30,
    size: 0.8 + Math.random() * sizeFactor,
    alpha: 0.7 + Math.random() * 0.3,
    settled: false,
  };
}

export function updateAshParticles(
  particles: AshParticle[],
  temp: number,
  isBurning: boolean,
  canvasWidth: number,
  burnTime: number,
  grindLevel: number = 5
): AshParticle[] {
  const updated = particles.map((p) => {
    if (p.settled) return p;

    const grindSpeedFactor = 0.7 + (grindLevel / 10) * 0.6;
    const speed = (0.5 + (temp - 120) / 160) * grindSpeedFactor;
    const newY = p.y + speed;

    if (newY >= p.targetY) {
      return { ...p, y: p.targetY, settled: true };
    }

    const drift = (Math.random() - 0.5) * 0.5;
    return { ...p, y: newY, x: p.x + drift };
  });

  const spawnRate = 0.1 + (grindLevel / 10) * 0.15 + (temp - 120) / 400;
  if (isBurning && Math.random() < spawnRate) {
    updated.push(generateAshParticle(canvasWidth, burnTime, grindLevel));
  }

  return updated.slice(-250);
}

function buildAshGradientStops(temperature: number, burnTime: number): ColorStop[] {
  const range = getColorRangeForTemp(temperature);
  const timeEffect = Math.min(1, burnTime / 120);
  const timeDarken = timeEffect * 0.2;

  const c = range.centerColor;
  const m = range.midColor;
  const e = range.edgeColor;

  const dc = {
    r: Math.max(20, Math.round(c.r - timeDarken * 80)),
    g: Math.max(15, Math.round(c.g - timeDarken * 90)),
    b: Math.max(10, Math.round(c.b - timeDarken * 100)),
  };
  const dm = {
    r: Math.max(30, Math.round(m.r - timeDarken * 50)),
    g: Math.max(25, Math.round(m.g - timeDarken * 60)),
    b: Math.max(15, Math.round(m.b - timeDarken * 70)),
  };
  const de = {
    r: Math.round(e.r - timeDarken * 20),
    g: Math.round(e.g - timeDarken * 25),
    b: Math.round(e.b - timeDarken * 30),
  };

  return [
    { pos: 0, ...dc, a: 0.95 },
    { pos: 0.25, ...dm, a: 0.85 },
    { pos: 0.6, ...de, a: 0.7 },
    { pos: 1, r: Math.min(255, de.r + 30), g: Math.min(255, de.g + 30), b: Math.min(255, de.b + 30), a: 0.5 },
  ];
}

function rgbaStr(c: ColorStop): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

export function drawAshCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: AshParticle[],
  _ashColor: { r: number; g: number; b: number },
  burnTime: number,
  temperature: number = 150
): void {
  ctx.clearRect(0, 0, width, height);

  const tempFactor = Math.min(1, Math.max(0, (temperature - 120) / 80));
  const gradientStops = buildAshGradientStops(temperature, burnTime);

  const ashBedVertical = ctx.createLinearGradient(0, 0, 0, height);
  gradientStops.forEach((stop) => {
    ashBedVertical.addColorStop(stop.pos, rgbaStr(stop));
  });

  ctx.fillStyle = ashBedVertical;
  ctx.beginPath();
  ctx.ellipse(width / 2, height * 0.78, width * 0.44, height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  const ashBedHorizontal = ctx.createLinearGradient(0, 0, width, 0);
  const edgeColor = gradientStops[gradientStops.length - 1];
  const centerColor = gradientStops[0];
  ashBedHorizontal.addColorStop(0, `rgba(${edgeColor.r + 30}, ${edgeColor.g + 30}, ${edgeColor.b + 30}, 0.3)`);
  ashBedHorizontal.addColorStop(0.3, rgbaStr(gradientStops[2]));
  ashBedHorizontal.addColorStop(0.5, rgbaStr(centerColor));
  ashBedHorizontal.addColorStop(0.7, rgbaStr(gradientStops[2]));
  ashBedHorizontal.addColorStop(1, `rgba(${edgeColor.r + 30}, ${edgeColor.g + 30}, ${edgeColor.b + 30}, 0.3)`);

  ctx.fillStyle = ashBedHorizontal;
  ctx.beginPath();
  ctx.ellipse(width / 2, height * 0.78, width * 0.42, height * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  const range = getColorRangeForTemp(temperature);
  const timeEffect = Math.min(1, burnTime / 120);

  const settledParticles = particles.filter((p) => p.settled);
  const floatingParticles = particles.filter((p) => !p.settled);

  if (settledParticles.length > 0) {
    const ashLayerGrad = ctx.createRadialGradient(
      width / 2, height * 0.65, 0,
      width / 2, height * 0.65, width * 0.38
    );

    const sc = range.centerColor;
    const sm = range.midColor;
    const se = range.edgeColor;
    const tD = timeEffect * 0.15;

    ashLayerGrad.addColorStop(0, `rgba(${Math.max(20, sc.r - tD * 80)}, ${Math.max(15, sc.g - tD * 90)}, ${Math.max(10, sc.b - tD * 100)}, 0.9)`);
    ashLayerGrad.addColorStop(0.4, `rgba(${sm.r}, ${sm.g}, ${sm.b}, 0.75)`);
    ashLayerGrad.addColorStop(0.8, `rgba(${se.r}, ${se.g}, ${se.b}, 0.5)`);
    ashLayerGrad.addColorStop(1, `rgba(${se.r + 20}, ${se.g + 20}, ${se.b + 20}, 0.2)`);

    ctx.fillStyle = ashLayerGrad;
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.75, width * 0.35, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const particleGrad = ctx.createLinearGradient(
    width / 2 - width * 0.35, 0,
    width / 2 + width * 0.35, 0
  );
  particleGrad.addColorStop(0, `rgba(${range.edgeColor.r}, ${range.edgeColor.g}, ${range.edgeColor.b}, 0.6)`);
  particleGrad.addColorStop(0.35, `rgba(${range.midColor.r}, ${range.midColor.g}, ${range.midColor.b}, 0.8)`);
  particleGrad.addColorStop(0.5, `rgba(${range.centerColor.r}, ${range.centerColor.g}, ${range.centerColor.b}, 0.9)`);
  particleGrad.addColorStop(0.65, `rgba(${range.midColor.r}, ${range.midColor.g}, ${range.midColor.b}, 0.8)`);
  particleGrad.addColorStop(1, `rgba(${range.edgeColor.r}, ${range.edgeColor.g}, ${range.edgeColor.b}, 0.6)`);

  floatingParticles.forEach((p) => {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    const distFromCenter = Math.abs(p.x - width / 2) / (width * 0.35);
    const t = Math.min(1, distFromCenter);
    const pColor = lerpColor(range.centerColor, range.edgeColor, t);

    grad.addColorStop(0, `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${p.alpha * 0.9})`);
    grad.addColorStop(0.6, `rgba(${pColor.r + 15}, ${pColor.g + 15}, ${pColor.b + 15}, ${p.alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${pColor.r + 30}, ${pColor.g + 30}, ${pColor.b + 30}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  settledParticles.forEach((p) => {
    const distFromCenter = Math.abs(p.x - width / 2) / (width * 0.35);
    const t = Math.min(1, distFromCenter);
    const pColor = lerpColor(range.centerColor, range.edgeColor, t);
    const settleFade = 0.85;

    ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${p.alpha * settleFade})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  const glowGradient = ctx.createRadialGradient(
    width / 2, 50, 0,
    width / 2, 50, 45 + tempFactor * 35
  );
  const glowAlpha = 0.3 + tempFactor * 0.4 + (burnTime > 0 ? 0.15 : 0);
  glowGradient.addColorStop(0, `rgba(255, ${130 + tempFactor * 70}, 30, ${glowAlpha})`);
  glowGradient.addColorStop(0.35, `rgba(255, ${90 + tempFactor * 50}, 15, ${glowAlpha * 0.5})`);
  glowGradient.addColorStop(0.7, `rgba(200, 60, 10, ${glowAlpha * 0.15})`);
  glowGradient.addColorStop(1, 'rgba(180, 40, 5, 0)');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, 0, width, height);

  const smokeCount = 2 + Math.floor(tempFactor * 4);
  for (let i = 0; i < smokeCount; i++) {
    const x = width / 2 + (Math.random() - 0.5) * (20 + tempFactor * 30);
    const y = 40 + Math.random() * 15;
    const smokeR = 25 + tempFactor * 25;
    const smokeGradient = ctx.createRadialGradient(x, y, 0, x, y, smokeR);
    const smokeAlpha = 0.08 + tempFactor * 0.1;
    smokeGradient.addColorStop(0, `rgba(${range.midColor.r + 40}, ${range.midColor.g + 40}, ${range.midColor.b + 40}, ${smokeAlpha})`);
    smokeGradient.addColorStop(0.5, `rgba(${range.edgeColor.r + 30}, ${range.edgeColor.g + 30}, ${range.edgeColor.b + 30}, ${smokeAlpha * 0.4})`);
    smokeGradient.addColorStop(1, `rgba(${range.edgeColor.r + 50}, ${range.edgeColor.g + 50}, ${range.edgeColor.b + 50}, 0)`);
    ctx.fillStyle = smokeGradient;
    ctx.beginPath();
    ctx.arc(x, y, smokeR, 0, Math.PI * 2);
    ctx.fill();
  }

  if (burnTime > 5) {
    const heatShimmerGrad = ctx.createLinearGradient(width / 2 - 30, 0, width / 2 + 30, 0);
    heatShimmerGrad.addColorStop(0, 'rgba(255, 200, 100, 0)');
    heatShimmerGrad.addColorStop(0.3, `rgba(255, 180, 80, ${0.03 + tempFactor * 0.05})`);
    heatShimmerGrad.addColorStop(0.5, `rgba(255, 160, 60, ${0.05 + tempFactor * 0.08})`);
    heatShimmerGrad.addColorStop(0.7, `rgba(255, 180, 80, ${0.03 + tempFactor * 0.05})`);
    heatShimmerGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = heatShimmerGrad;
    ctx.fillRect(width / 2 - 40, 0, 80, height * 0.4);
  }
}
