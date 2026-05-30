import { DiseasePreset } from '../types';

export const diseasePresets: DiseasePreset[] = [
  {
    id: 'covid',
    name: '新冠病毒检测',
    description: '基于人群流行率的PCR检测',
    priorProbability: 0.01,
    sensitivity: 0.95,
    falsePositiveRate: 0.02,
  },
  {
    id: 'hiv',
    name: '艾滋病筛查',
    description: '普通人群HIV抗体检测',
    priorProbability: 0.003,
    sensitivity: 0.998,
    falsePositiveRate: 0.001,
  },
  {
    id: 'breast-cancer',
    name: '乳腺癌筛查',
    description: '40-50岁女性乳腺X线筛查',
    priorProbability: 0.008,
    sensitivity: 0.90,
    falsePositiveRate: 0.07,
  },
  {
    id: 'colorectal-cancer',
    name: '结直肠癌筛查',
    description: '50岁以上人群粪便隐血试验',
    priorProbability: 0.005,
    sensitivity: 0.85,
    falsePositiveRate: 0.05,
  },
  {
    id: 'diabetes',
    name: '糖尿病筛查',
    description: '空腹血糖检测',
    priorProbability: 0.07,
    sensitivity: 0.80,
    falsePositiveRate: 0.05,
  },
];

export const defaultPreset = diseasePresets[0];

export const TOTAL_POPULATION = 10000;
