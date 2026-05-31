import { VowelData, Gender } from '@/types';
import { FEMALE_SCALE_FACTOR, CHART_BOUNDS } from '@/data/vowels';

export const getF1Frequency = (vowel: VowelData, gender: Gender): number => {
  const baseF1 = vowel.f1Male;
  return gender === 'female' ? Math.round(baseF1 * FEMALE_SCALE_FACTOR) : baseF1;
};

export const getF2Frequency = (vowel: VowelData, gender: Gender): number => {
  const baseF2 = vowel.f2Male;
  return gender === 'female' ? Math.round(baseF2 * FEMALE_SCALE_FACTOR) : baseF2;
};

export const f1ToCanvasY = (
  f1: number,
  canvasHeight: number,
  paddingTop: number,
  paddingBottom: number
): number => {
  const { f1Min, f1Max } = CHART_BOUNDS;
  const chartHeight = canvasHeight - paddingTop - paddingBottom;
  const normalizedF1 = (f1 - f1Min) / (f1Max - f1Min);
  return paddingTop + chartHeight * (1 - normalizedF1);
};

export const f2ToCanvasX = (
  f2: number,
  canvasWidth: number,
  paddingLeft: number,
  paddingRight: number
): number => {
  const { f2Min, f2Max } = CHART_BOUNDS;
  const chartWidth = canvasWidth - paddingLeft - paddingRight;
  const normalizedF2 = (f2 - f2Min) / (f2Max - f2Min);
  return paddingLeft + chartWidth * (1 - normalizedF2);
};

export const canvasYToF1 = (
  y: number,
  canvasHeight: number,
  paddingTop: number,
  paddingBottom: number
): number => {
  const { f1Min, f1Max } = CHART_BOUNDS;
  const chartHeight = canvasHeight - paddingTop - paddingBottom;
  const normalizedY = 1 - (y - paddingTop) / chartHeight;
  return f1Min + normalizedY * (f1Max - f1Min);
};

export const canvasXToF2 = (
  x: number,
  canvasWidth: number,
  paddingLeft: number,
  paddingRight: number
): number => {
  const { f2Min, f2Max } = CHART_BOUNDS;
  const chartWidth = canvasWidth - paddingLeft - paddingRight;
  const normalizedX = 1 - (x - paddingLeft) / chartWidth;
  return f2Min + normalizedX * (f2Max - f2Min);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};
