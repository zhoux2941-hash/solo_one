import { PointCharge, ConductorSphere, InducedCharge, K } from '@/types/physics';

export function calculateInducedCharges(
  conductor: ConductorSphere,
  charges: PointCharge[],
  numSamples: number = 36
): InducedCharge[] {
  const inducedCharges: InducedCharge[] = [];
  const R = conductor.radius;

  for (let i = 0; i < numSamples; i++) {
    const angle = (2 * Math.PI * i) / numSamples;
    const x = conductor.x + R * Math.cos(angle);
    const y = conductor.y + R * Math.sin(angle);

    let normalComponent = 0;

    for (const charge of charges) {
      const dx = charge.x - conductor.x;
      const dy = charge.y - conductor.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < R * 0.5) continue;

      const mirrorCharge = -charge.charge * (R / d);
      const mirrorDist = (R * R) / d;
      const mirrorAngle = Math.atan2(dy, dx);
      const mirrorX = conductor.x + mirrorDist * Math.cos(mirrorAngle);
      const mirrorY = conductor.y + mirrorDist * Math.sin(mirrorAngle);

      const surfaceToMirrorX = x - mirrorX;
      const surfaceToMirrorY = y - mirrorY;
      const distToMirror = Math.sqrt(surfaceToMirrorX * surfaceToMirrorX + surfaceToMirrorY * surfaceToMirrorY);

      const normalX = Math.cos(angle);
      const normalY = Math.sin(angle);

      const E_mirror = (K * Math.abs(mirrorCharge)) / (distToMirror * distToMirror);
      const sign = mirrorCharge > 0 ? 1 : -1;

      const E_normal =
        sign * E_mirror * ((surfaceToMirrorX / distToMirror) * normalX + (surfaceToMirrorY / distToMirror) * normalY);

      normalComponent += E_normal;
    }

    const surfaceChargeDensity = normalComponent;

    inducedCharges.push({
      x,
      y,
      charge: surfaceChargeDensity,
      angle,
    });
  }

  return inducedCharges;
}

export function calculateTotalInducedCharge(inducedCharges: InducedCharge[]): number {
  let total = 0;
  for (const ic of inducedCharges) {
    total += ic.charge;
  }
  return total;
}

export function isPointInConductor(x: number, y: number, conductor: ConductorSphere): boolean {
  const dx = x - conductor.x;
  const dy = y - conductor.y;
  return dx * dx + dy * dy <= conductor.radius * conductor.radius;
}

export function findConductorAtPoint(
  x: number,
  y: number,
  conductors: ConductorSphere[]
): ConductorSphere | null {
  for (let i = conductors.length - 1; i >= 0; i--) {
    if (isPointInConductor(x, y, conductors[i])) {
      return conductors[i];
    }
  }
  return null;
}
