export type MaterialType = 'rubber' | 'steel' | 'glass' | 'custom';

export interface MaterialPreset {
  label: string;
  restitution: number;
  color: string;
  icon: string;
}

export const MATERIAL_PRESETS: Record<MaterialType, MaterialPreset> = {
  rubber: { label: '橡胶', restitution: 0.82, color: '#ff6b35', icon: '🟠' },
  steel: { label: '钢', restitution: 0.60, color: '#a0aec0', icon: '⚪' },
  glass: { label: '玻璃', restitution: 0.70, color: '#63b3ed', icon: '🔵' },
  custom: { label: '自定义', restitution: 0.50, color: '#00e5ff', icon: '⚙️' },
};

export interface CollisionResult {
  v1After: number;
  v2After: number;
  keBefore: number;
  keAfter: number;
  keLossPercent: number;
  momentumBefore: number;
  momentumAfter: number;
  momentumDiff: number;
}

export function calculateCollision(
  m1: number,
  m2: number,
  v1: number,
  v2: number,
  e: number
): CollisionResult {
  const totalM = m1 + m2;
  const v1After = (m1 * v1 + m2 * v2 - m2 * e * (v1 - v2)) / totalM;
  const v2After = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / totalM;

  const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const keAfter = 0.5 * m1 * v1After * v1After + 0.5 * m2 * v2After * v2After;

  const keLossPercent = keBefore > 0
    ? ((1 - keAfter / keBefore) * 100)
    : 0;

  const momentumBefore = m1 * v1 + m2 * v2;
  const momentumAfter = m1 * v1After + m2 * v2After;
  const momentumDiff = Math.abs(momentumAfter - momentumBefore);

  return {
    v1After,
    v2After,
    keBefore,
    keAfter,
    keLossPercent,
    momentumBefore,
    momentumAfter,
    momentumDiff,
  };
}

export function getRestitution(m1: MaterialType, m2: MaterialType): number {
  if (m1 === 'custom' || m2 === 'custom') {
    return Math.min(MATERIAL_PRESETS[m1].restitution, MATERIAL_PRESETS[m2].restitution);
  }
  return (MATERIAL_PRESETS[m1].restitution + MATERIAL_PRESETS[m2].restitution) / 2;
}
