import { Point } from '../types';

export const pointsToPath = (points: Point[]): string => {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M${first.x},${first.y} ${rest.map(p => `L${p.x},${p.y}`).join(' ')} Z`;
};

export const getStructureColor = (type: string): string => {
  const colors: Record<string, string> = {
    outlet: '#8B4513',
    canal: '#4A90A4',
    reservoir: '#2E5A6B',
    moat: '#1E3A4A',
  };
  return colors[type] || '#666';
};

export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const generatePathId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
