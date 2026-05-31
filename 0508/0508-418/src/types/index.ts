export interface VowelData {
  id: string;
  ipa: string;
  exampleWord: string;
  f1Male: number;
  f2Male: number;
}

export type Gender = 'male' | 'female';

export interface Point {
  x: number;
  y: number;
}

export interface ChartPoint extends Point {
  vowel: VowelData;
  f1: number;
  f2: number;
}
