import { PointCharge, Vector2D, FIELD_LINE_MAX_STEPS, FIELD_LINE_STEP, CHARGE_RADIUS } from '@/types/physics';
import { calculateElectricField } from './electricField';

export function traceFieldLine(
  startX: number,
  startY: number,
  charges: PointCharge[],
  width: number,
  height: number,
  direction: 1 | -1 = 1
): Vector2D[] {
  const points: Vector2D[] = [];
  let x = startX;
  let y = startY;

  for (let i = 0; i < FIELD_LINE_MAX_STEPS; i++) {
    if (x < 0 || x > width || y < 0 || y > height) break;

    const field = calculateElectricField(x, y, charges);
    const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);

    if (magnitude < 1e-10) break;

    points.push({ x, y });

    let nearNegativeCharge = false;
    for (const charge of charges) {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (charge.charge < 0 && dist < CHARGE_RADIUS) {
        nearNegativeCharge = true;
        break;
      }
    }
    if (nearNegativeCharge && direction > 0) break;

    let nearPositiveCharge = false;
    for (const charge of charges) {
      const dx = x - charge.x;
      const dy = y - charge.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (charge.charge > 0 && dist < CHARGE_RADIUS) {
        nearPositiveCharge = true;
        break;
      }
    }
    if (nearPositiveCharge && direction < 0) break;

    const step = FIELD_LINE_STEP;
    x += direction * (field.x / magnitude) * step;
    y += direction * (field.y / magnitude) * step;
  }

  return points;
}

export function generateFieldLines(
  charges: PointCharge[],
  width: number,
  height: number,
  density: number
): Vector2D[][] {
  const lines: Vector2D[][] = [];
  const linesPerCharge = Math.max(4, Math.floor(density / 10));

  for (const charge of charges) {
    if (charge.charge > 0) {
      const numLines = linesPerCharge;

      for (let i = 0; i < numLines; i++) {
        const angle = (2 * Math.PI * i) / numLines;
        const startX = charge.x + CHARGE_RADIUS * Math.cos(angle);
        const startY = charge.y + CHARGE_RADIUS * Math.sin(angle);

        const line = traceFieldLine(startX, startY, charges, width, height, 1);
        if (line.length > 2) {
          lines.push(line);
        }
      }
    }
  }

  if (charges.filter((c) => c.charge < 0).length > 0 && charges.filter((c) => c.charge > 0).length === 0) {
    for (const charge of charges) {
      if (charge.charge < 0) {
        const numLines = linesPerCharge;

        for (let i = 0; i < numLines; i++) {
          const angle = (2 * Math.PI * i) / numLines;
          const startX = charge.x + CHARGE_RADIUS * Math.cos(angle);
          const startY = charge.y + CHARGE_RADIUS * Math.sin(angle);

          const line = traceFieldLine(startX, startY, charges, width, height, -1);
          if (line.length > 2) {
            lines.push(line);
          }
        }
      }
    }
  }

  return lines;
}
