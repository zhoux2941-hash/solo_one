import { VowelData } from '@/types';

export const VOWELS: VowelData[] = [
  {
    id: 'i',
    ipa: 'i',
    exampleWord: 'see',
    f1Male: 270,
    f2Male: 2290,
  },
  {
    id: 'e',
    ipa: 'ɛ',
    exampleWord: 'bed',
    f1Male: 530,
    f2Male: 1840,
  },
  {
    id: 'a',
    ipa: 'ɑ',
    exampleWord: 'father',
    f1Male: 730,
    f2Male: 1090,
  },
  {
    id: 'o',
    ipa: 'ɔ',
    exampleWord: 'law',
    f1Male: 570,
    f2Male: 840,
  },
  {
    id: 'u',
    ipa: 'u',
    exampleWord: 'boot',
    f1Male: 300,
    f2Male: 870,
  },
];

export const FEMALE_SCALE_FACTOR = 1.2;

export const CHART_BOUNDS = {
  f1Min: 200,
  f1Max: 900,
  f2Min: 600,
  f2Max: 2500,
};
