import type { CircuitParams, CalculationResult, KeyPointData } from '@/types';

export function calculateTau(params: CircuitParams): number {
  return params.resistance * params.capacitance * 1e-3;
}

export function chargeVoltage(v0: number, t: number, tau: number): number {
  if (tau === 0) return v0;
  return v0 * (1 - Math.exp(-t / tau));
}

export function dischargeVoltage(v0: number, t: number, tau: number): number {
  if (tau === 0) return 0;
  return v0 * Math.exp(-t / tau);
}

interface TimeSegment {
  start: number;
  end: number;
  numPoints: number;
}

function buildAdaptiveSegments(tau: number): TimeSegment[] {
  const maxTime = tau * 5;

  return [
    { start: 0, end: 0.1 * tau, numPoints: 80 },
    { start: 0.1 * tau, end: 0.5 * tau, numPoints: 80 },
    { start: 0.5 * tau, end: tau, numPoints: 80 },
    { start: tau, end: 2 * tau, numPoints: 80 },
    { start: 2 * tau, end: 3 * tau, numPoints: 60 },
    { start: 3 * tau, end: 5 * tau, numPoints: 60 },
  ].filter((seg) => seg.start < maxTime);
}

function generateTimePoints(tau: number): number[] {
  const segments = buildAdaptiveSegments(tau);
  const points = new Set<number>();

  points.add(0);

  for (const seg of segments) {
    const actualEnd = Math.min(seg.end, tau * 5);
    for (let i = 1; i <= seg.numPoints; i++) {
      const t = seg.start + ((actualEnd - seg.start) * i) / seg.numPoints;
      points.add(t);
    }
  }

  points.add(tau);
  points.add(2 * tau);
  points.add(3 * tau);
  points.add(5 * tau);

  return Array.from(points).sort((a, b) => a - b);
}

export function calculateAll(params: CircuitParams): CalculationResult {
  const tau = calculateTau(params);
  const v0 = params.voltage;

  const timePoints = generateTimePoints(tau);
  const chargeVoltages = timePoints.map((t) => chargeVoltage(v0, t, tau));
  const dischargeVoltages = timePoints.map((t) => dischargeVoltage(v0, t, tau));

  const makeKeyPoint = (multiplier: number): KeyPointData => {
    const t = tau * multiplier;
    return {
      time: t,
      chargeV: chargeVoltage(v0, t, tau),
      dischargeV: dischargeVoltage(v0, t, tau),
    };
  };

  return {
    tau,
    chargeVoltages,
    dischargeVoltages,
    timePoints,
    keyPoints: {
      tau1: makeKeyPoint(1),
      tau2: makeKeyPoint(2),
      tau3: makeKeyPoint(3),
      tau5: makeKeyPoint(5),
    },
  };
}

export function formatTime(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(2)} ms`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(2)} μs`;
  return `${(seconds * 1e9).toFixed(2)} ns`;
}

export function formatVoltage(v: number): string {
  return `${v.toFixed(3)} V`;
}

export function formatPercent(v: number, v0: number): string {
  return `${((v / v0) * 100).toFixed(1)}%`;
}
