import { CalibrationPoint, DataPoint, FittingResult } from '../types';
import { findTheoreticalTimeForHeight } from './physics';

function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < A.length; i++) {
    result[i] = [];
    for (let j = 0; j < B[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < A[0].length; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function transposeMatrix(A: number[][]): number[][] {
  const result: number[][] = [];
  for (let j = 0; j < A[0].length; j++) {
    result[j] = [];
    for (let i = 0; i < A.length; i++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }

    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-10) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  const solution: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= augmented[i][j] * solution[j];
    }
    solution[i] = sum / augmented[i][i];
  }

  return solution;
}

function polynomialRegression(
  xValues: number[],
  yValues: number[],
  degree: number
): number[] {
  const n = xValues.length;
  const A: number[][] = [];
  const b: number[] = yValues;

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(xValues[i], j));
    }
    A.push(row);
  }

  const At = transposeMatrix(A);
  const AtA = multiplyMatrices(At, A);
  const Atb = multiplyMatrices(At, b.map((val) => [val])).map((row) => row[0]);

  return gaussianElimination(AtA, Atb);
}

function calculatePolynomialValue(x: number, coefficients: number[]): number {
  let result = 0;
  for (let i = 0; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(x, i);
  }
  return result;
}

function calculateRSquared(
  xValues: number[],
  yValues: number[],
  coefficients: number[]
): number {
  const meanY = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  let totalSumSquares = 0;
  let residualSumSquares = 0;

  for (let i = 0; i < xValues.length; i++) {
    const predicted = calculatePolynomialValue(xValues[i], coefficients);
    totalSumSquares += Math.pow(yValues[i] - meanY, 2);
    residualSumSquares += Math.pow(yValues[i] - predicted, 2);
  }

  return totalSumSquares === 0 ? 1 : 1 - residualSumSquares / totalSumSquares;
}

function buildCorrectionFormula(coefficients: number[]): string {
  const terms: string[] = [];

  for (let i = coefficients.length - 1; i >= 0; i--) {
    const coef = coefficients[i];
    if (Math.abs(coef) < 1e-10) continue;

    let term = '';
    const absCoef = Math.abs(coef);
    const coefStr = absCoef.toFixed(4);

    if (i === 0) {
      term = coefStr;
    } else if (i === 1) {
      term = `${coefStr}t`;
    } else {
      term = `${coefStr}t^${i}`;
    }

    if (coef < 0 && terms.length > 0) {
      terms.push(` - ${term}`);
    } else if (terms.length > 0) {
      terms.push(` + ${term}`);
    } else {
      terms.push(coef < 0 ? `-${term}` : term);
    }
  }

  return terms.length > 0 ? `t_corrected = ${terms.join('')}` : 't_corrected = 0';
}

export function performCurveFitting(
  calibrationPoints: CalibrationPoint[],
  theoreticalData: DataPoint[]
): FittingResult | null {
  if (calibrationPoints.length < 2) return null;

  const xValues: number[] = [];
  const yValues: number[] = [];

  for (const point of calibrationPoints) {
    const theoreticalTime = findTheoreticalTimeForHeight(
      theoreticalData,
      point.observedWaterHeight
    );
    xValues.push(theoreticalTime);
    yValues.push(point.observedTime);
  }

  const degree = Math.min(calibrationPoints.length - 1, 3);
  const coefficients = polynomialRegression(xValues, yValues, degree);
  const rSquared = calculateRSquared(xValues, yValues, coefficients);

  const correctedTimeScale: DataPoint[] = theoreticalData.map((point) => {
    const correctedTime = Math.max(
      0,
      calculatePolynomialValue(point.time, coefficients)
    );
    return {
      ...point,
      time: correctedTime,
    };
  });

  const correctionFormula = buildCorrectionFormula(coefficients);

  return {
    coefficients,
    correctedTimeScale,
    rSquared,
    correctionFormula,
  };
}

export function generateTimeScaleTable(
  data: DataPoint[],
  intervals: number = 10
): Array<{ time: string; waterHeight: string; flowRate: string }> {
  if (data.length < 2) return [];

  const totalTime = data[data.length - 1].time;
  const step = totalTime / intervals;
  const table: Array<{ time: string; waterHeight: string; flowRate: string }> = [];

  for (let i = 0; i <= intervals; i++) {
    const targetTime = i * step;

    for (let j = 1; j < data.length; j++) {
      if (data[j].time >= targetTime) {
        const prev = data[j - 1];
        const curr = data[j];
        const ratio =
          prev.time === curr.time
            ? 0
            : (targetTime - prev.time) / (curr.time - prev.time);

        const waterHeight =
          prev.waterHeight + ratio * (curr.waterHeight - prev.waterHeight);
        const flowRate =
          prev.flowRate + ratio * (curr.flowRate - prev.flowRate);

        table.push({
          time: formatTime(targetTime),
          waterHeight: waterHeight.toFixed(2),
          flowRate: flowRate.toFixed(4),
        });
        break;
      }
    }
  }

  return table;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}时${minutes.toString().padStart(2, '0')}分${secs.toString().padStart(2, '0')}秒`;
  } else if (minutes > 0) {
    return `${minutes}分${secs.toString().padStart(2, '0')}秒`;
  } else {
    return `${secs.toFixed(1)}秒`;
  }
}
