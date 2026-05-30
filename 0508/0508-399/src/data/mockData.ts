import type { Period, Plaque } from '../types';

export async function fetchPeriods(): Promise<Period[]> {
  const res = await fetch('/data/periods.json');
  if (!res.ok) {
    throw new Error('Failed to load periods data');
  }
  return res.json();
}

export async function fetchPlaques(): Promise<Plaque[]> {
  const res = await fetch('/data/plaques.json');
  if (!res.ok) {
    throw new Error('Failed to load plaques data');
  }
  return res.json();
}
