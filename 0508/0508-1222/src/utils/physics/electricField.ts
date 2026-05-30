import { PointCharge, Vector2D, K } from '@/types/physics';

export function calculateElectricField(
  x: number,
  y: number,
  charges: PointCharge[]
): Vector2D {
  let Ex = 0;
  let Ey = 0;

  for (const charge of charges) {
    const dx = x - charge.x;
    const dy = y - charge.y;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);

    if (r < 5) continue;

    const E = (K * Math.abs(charge.charge)) / r2;
    const sign = charge.charge > 0 ? 1 : -1;

    Ex += sign * E * (dx / r);
    Ey += sign * E * (dy / r);
  }

  return { x: Ex, y: Ey };
}

export function calculateVectorFieldGrid(
  width: number,
  height: number,
  density: number,
  charges: PointCharge[]
): { x: number; y: number; Ex: number; Ey: number; magnitude: number }[] {
  const vectors: { x: number; y: number; Ex: number; Ey: number; magnitude: number }[] = [];
  const step = Math.max(20, 100 - density);

  let maxMagnitude = 0;

  for (let x = step; x < width; x += step) {
    for (let y = step; y < height; y += step) {
      const field = calculateElectricField(x, y, charges);
      const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);
      if (magnitude > maxMagnitude) maxMagnitude = magnitude;
      vectors.push({ x, y, Ex: field.x, Ey: field.y, magnitude });
    }
  }

  const logMax = maxMagnitude > 0 ? Math.log(maxMagnitude) : 1;

  return vectors.map((v) => ({
    ...v,
    magnitude: v.magnitude > 0 ? Math.log(v.magnitude) / logMax : 0,
  }));
}
