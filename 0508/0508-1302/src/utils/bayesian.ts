import { BayesianParams, BayesianResult, CalculationStep, TestResult } from '../types';
import { TOTAL_POPULATION } from '../data/presets';

export function calculateBayesian(
  params: BayesianParams,
  testResult: 'positive' | 'negative' = 'positive'
): BayesianResult {
  const { priorProbability, sensitivity, falsePositiveRate } = params;

  const totalPopulation = TOTAL_POPULATION;
  
  const truePositives = totalPopulation * priorProbability * sensitivity;
  const falseNegatives = totalPopulation * priorProbability * (1 - sensitivity);
  const falsePositives = totalPopulation * (1 - priorProbability) * falsePositiveRate;
  const trueNegatives = totalPopulation * (1 - priorProbability) * (1 - falsePositiveRate);

  let posteriorProbability: number;
  let calculationSteps: CalculationStep[];

  if (testResult === 'positive') {
    const totalPositives = truePositives + falsePositives;
    posteriorProbability = totalPositives > 0 ? truePositives / totalPositives : 0;

    calculationSteps = [
      {
        formula: 'P(患病) = 先验概率',
        description: '人群中患病的概率（患病率）',
        value: priorProbability,
      },
      {
        formula: 'P(阳性|患病) = 灵敏度',
        description: '真阳性率：患病者检测为阳性的概率',
        value: sensitivity,
      },
      {
        formula: 'P(阳性|未患病) = 假阳性率',
        description: '未患病者检测为阳性的概率',
        value: falsePositiveRate,
      },
      {
        formula: 'P(阳性且患病) = P(患病) × P(阳性|患病)',
        description: '真阳性联合概率',
        value: priorProbability * sensitivity,
      },
      {
        formula: 'P(阳性且未患病) = P(未患病) × P(阳性|未患病)',
        description: '假阳性联合概率',
        value: (1 - priorProbability) * falsePositiveRate,
      },
      {
        formula: 'P(阳性) = P(阳性且患病) + P(阳性且未患病)',
        description: '检测为阳性的总概率',
        value: priorProbability * sensitivity + (1 - priorProbability) * falsePositiveRate,
      },
      {
        formula: 'P(患病|阳性) = P(阳性且患病) / P(阳性)',
        description: '贝叶斯后验概率：检测阳性时真正患病的概率',
        value: posteriorProbability,
      },
    ];
  } else {
    const totalNegatives = trueNegatives + falseNegatives;
    posteriorProbability = totalNegatives > 0 ? falseNegatives / totalNegatives : 0;

    calculationSteps = [
      {
        formula: 'P(患病) = 先验概率',
        description: '人群中患病的概率（患病率）',
        value: priorProbability,
      },
      {
        formula: 'P(阴性|患病) = 1 - 灵敏度',
        description: '假阴性率：患病者检测为阴性的概率',
        value: 1 - sensitivity,
      },
      {
        formula: 'P(阴性|未患病) = 1 - 假阳性率',
        description: '真阴性率：未患病者检测为阴性的概率',
        value: 1 - falsePositiveRate,
      },
      {
        formula: 'P(阴性且患病) = P(患病) × P(阴性|患病)',
        description: '假阴性联合概率',
        value: priorProbability * (1 - sensitivity),
      },
      {
        formula: 'P(阴性且未患病) = P(未患病) × P(阴性|未患病)',
        description: '真阴性联合概率',
        value: (1 - priorProbability) * (1 - falsePositiveRate),
      },
      {
        formula: 'P(阴性) = P(阴性且患病) + P(阴性且未患病)',
        description: '检测为阴性的总概率',
        value: priorProbability * (1 - sensitivity) + (1 - priorProbability) * (1 - falsePositiveRate),
      },
      {
        formula: 'P(患病|阴性) = P(阴性且患病) / P(阴性)',
        description: '贝叶斯后验概率：检测阴性时仍患病的概率',
        value: posteriorProbability,
      },
    ];
  }

  return {
    posteriorProbability,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    totalPopulation,
    calculationSteps,
  };
}

export function performIteration(
  priorProbability: number,
  sensitivity: number,
  falsePositiveRate: number,
  testResult: 'positive' | 'negative',
  testNumber: number
): TestResult {
  const params: BayesianParams = {
    priorProbability,
    sensitivity,
    falsePositiveRate,
  };

  const result = calculateBayesian(params, testResult);

  return {
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    testNumber,
    testResult,
    params,
    result,
  };
}

export function calculateNextPrior(lastResult: TestResult): number {
  return lastResult.result.posteriorProbability;
}
