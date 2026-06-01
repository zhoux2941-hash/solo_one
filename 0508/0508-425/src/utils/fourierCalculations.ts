import type { WaveformType, HarmonicData, GibbsData } from '../types';

const HARMONIC_COLORS = [
  '#00d9ff',
  '#ff0080',
  '#ffd700',
  '#00ff88',
  '#ff6b6b',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
];

export function getHarmonicColor(index: number): string {
  return HARMONIC_COLORS[index % HARMONIC_COLORS.length];
}

export function calculateSquareWaveHarmonic(n: number): number {
  const k = 2 * n - 1;
  return 1 / k;
}

export function calculateTriangleWaveHarmonic(n: number): number {
  const k = 2 * n - 1;
  const sign = Math.pow(-1, (k - 1) / 2);
  return sign / (k * k);
}

export function calculateSawtoothWaveHarmonic(n: number): number {
  return Math.pow(-1, n + 1) / n;
}

export function getHarmonicCoefficient(
  n: number,
  waveformType: WaveformType
): number {
  switch (waveformType) {
    case 'square':
      return calculateSquareWaveHarmonic(n);
    case 'triangle':
      return calculateTriangleWaveHarmonic(n);
    case 'sawtooth':
      return calculateSawtoothWaveHarmonic(n);
    default:
      return 0;
  }
}

export function getHarmonicNumber(
  n: number,
  waveformType: WaveformType
): number {
  switch (waveformType) {
    case 'square':
    case 'triangle':
      return 2 * n - 1;
    case 'sawtooth':
      return n;
    default:
      return n;
  }
}

export function generateHarmonics(
  count: number,
  waveformType: WaveformType
): HarmonicData[] {
  const harmonics: HarmonicData[] = [];
  
  for (let i = 1; i <= count; i++) {
    const harmonicNum = getHarmonicNumber(i, waveformType);
    harmonics.push({
      n: harmonicNum,
      amplitude: getHarmonicCoefficient(i, waveformType),
      frequency: harmonicNum,
      phase: 0,
      color: getHarmonicColor(i - 1),
    });
  }
  
  return harmonics;
}

export function calculateWaveformValue(
  x: number,
  harmonics: HarmonicData[]
): number {
  let sum = 0.0;
  let c = 0.0;
  
  for (const h of harmonics) {
    const term = h.amplitude * Math.sin(h.frequency * x + h.phase);
    const y = term - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }
  
  return sum;
}

export function generateWaveformPoints(
  harmonics: HarmonicData[],
  numPoints: number = 2000,
  xRange: [number, number] = [0, 4 * Math.PI]
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  const [xMin, xMax] = xRange;
  const step = (xMax - xMin) / numPoints;
  
  for (let i = 0; i <= numPoints; i++) {
    const xi = xMin + i * step;
    x.push(xi);
    y.push(calculateWaveformValue(xi, harmonics));
  }
  
  return { x, y };
}

export function calculateGibbsPhenomenon(
  waveformData: number[],
  waveformType: WaveformType
): GibbsData {
  const maxValue = Math.max(...waveformData);
  const minValue = Math.min(...waveformData);
  const peakAmplitude = Math.max(Math.abs(maxValue), Math.abs(minValue));
  
  let idealValue = 1;
  let theoreticalOvershoot = 0;
  
  switch (waveformType) {
    case 'square':
      idealValue = Math.PI / 4;
      theoreticalOvershoot = 8.94;
      break;
    case 'triangle':
      idealValue = Math.PI * Math.PI / 8;
      theoreticalOvershoot = 0;
      break;
    case 'sawtooth':
      idealValue = Math.PI / 2;
      theoreticalOvershoot = 8.94;
      break;
  }
  
  const overshootPercent = ((peakAmplitude - idealValue) / idealValue) * 100;
  
  return {
    overshootPercent: Math.max(0, overshootPercent),
    theoreticalValue: theoreticalOvershoot,
    peakValue: peakAmplitude,
    idealValue,
  };
}

export function getWaveformName(type: WaveformType): string {
  switch (type) {
    case 'square':
      return '方波';
    case 'triangle':
      return '三角波';
    case 'sawtooth':
      return '锯齿波';
    default:
      return '未知';
  }
}

export function getWaveformFormula(type: WaveformType): string {
  switch (type) {
    case 'square':
      return 'f(x) = Σ sin((2n-1)x) / (2n-1)';
    case 'triangle':
      return 'f(x) = Σ (-1)^((n-1)/2) × sin(nx) / n²';
    case 'sawtooth':
      return 'f(x) = Σ (-1)^(n+1) × sin(nx) / n';
    default:
      return '';
  }
}
