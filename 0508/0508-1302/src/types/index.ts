export interface BayesianParams {
  priorProbability: number;
  sensitivity: number;
  falsePositiveRate: number;
}

export interface CalculationStep {
  formula: string;
  description: string;
  value: number;
}

export interface BayesianResult {
  posteriorProbability: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalPopulation: number;
  calculationSteps: CalculationStep[];
}

export interface TestResult {
  id: string;
  testNumber: number;
  testResult: 'positive' | 'negative';
  params: BayesianParams;
  result: BayesianResult;
}

export interface IterationState {
  tests: TestResult[];
  currentPrior: number;
}

export interface DiseasePreset {
  id: string;
  name: string;
  description: string;
  priorProbability: number;
  sensitivity: number;
  falsePositiveRate: number;
}

export type DisplayFormat = 'probability' | 'frequency';
