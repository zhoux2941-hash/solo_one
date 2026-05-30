export function convolve(signal: number[], kernel: number[]): number[] {
  const result: number[] = new Array(signal.length).fill(0);
  const halfKernel = Math.floor(kernel.length / 2);

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    for (let j = 0; j < kernel.length; j++) {
      const idx = i - halfKernel + j;
      if (idx >= 0 && idx < signal.length) {
        sum += signal[idx] * kernel[j];
      }
    }
    result[i] = sum;
  }

  return result;
}

export function createLowPassKernel(cutoffFreq: number, sampleRate: number, order: number = 51): number[] {
  const fc = cutoffFreq / sampleRate;
  const kernel: number[] = [];
  const halfOrder = Math.floor(order / 2);

  for (let i = 0; i < order; i++) {
    const n = i - halfOrder;
    if (n === 0) {
      kernel.push(2 * fc);
    } else {
      kernel.push(Math.sin(2 * Math.PI * fc * n) / (Math.PI * n));
    }
    kernel[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (order - 1));
  }

  const sum = kernel.reduce((a, b) => a + b, 0);
  return kernel.map(k => k / sum);
}

export function createHighPassKernel(cutoffFreq: number, sampleRate: number, order: number = 51): number[] {
  const lowPass = createLowPassKernel(cutoffFreq, sampleRate, order);
  const highPass: number[] = [];
  const halfOrder = Math.floor(order / 2);

  for (let i = 0; i < order; i++) {
    if (i === halfOrder) {
      highPass.push(1 - lowPass[i]);
    } else {
      highPass.push(-lowPass[i]);
    }
  }

  return highPass;
}

export function createBandPassKernel(
  lowFreq: number,
  highFreq: number,
  sampleRate: number,
  order: number = 51
): number[] {
  const lowPassHigh = createLowPassKernel(highFreq, sampleRate, order);
  const lowPassLow = createLowPassKernel(lowFreq, sampleRate, order);

  return lowPassHigh.map((val, idx) => val - lowPassLow[idx]);
}

export function applyLowPassFilter(
  signal: number[],
  cutoffFreq: number,
  sampleRate: number,
  order: number = 51
): number[] {
  const kernel = createLowPassKernel(cutoffFreq, sampleRate, order);
  return convolve(signal, kernel);
}

export function applyHighPassFilter(
  signal: number[],
  cutoffFreq: number,
  sampleRate: number,
  order: number = 51
): number[] {
  const kernel = createHighPassKernel(cutoffFreq, sampleRate, order);
  return convolve(signal, kernel);
}

export function applyBandPassFilter(
  signal: number[],
  lowFreq: number,
  highFreq: number,
  sampleRate: number,
  order: number = 51
): number[] {
  const kernel = createBandPassKernel(lowFreq, highFreq, sampleRate, order);
  return convolve(signal, kernel);
}

export interface FilterParams {
  type: 'none' | 'lowpass' | 'highpass' | 'bandpass';
  lowFreq?: number;
  highFreq?: number;
  order?: number;
}

export function applyFilter(
  signal: number[],
  params: FilterParams,
  sampleRate: number
): number[] {
  const order = params.order || 51;

  switch (params.type) {
    case 'lowpass':
      if (params.lowFreq !== undefined) {
        return applyLowPassFilter(signal, params.lowFreq, sampleRate, order);
      }
      return signal;
    case 'highpass':
      if (params.highFreq !== undefined) {
        return applyHighPassFilter(signal, params.highFreq, sampleRate, order);
      }
      return signal;
    case 'bandpass':
      if (params.lowFreq !== undefined && params.highFreq !== undefined) {
        return applyBandPassFilter(signal, params.lowFreq, params.highFreq, sampleRate, order);
      }
      return signal;
    default:
      return signal;
  }
}

export function normalize(signal: number[]): number[] {
  const max = Math.max(...signal.map(Math.abs));
  if (max === 0) return signal;
  return signal.map(v => v / max);
}

export function getMaxAmplitude(signal: number[]): number {
  return Math.max(...signal.map(Math.abs));
}

export function resample(signal: number[], targetLength: number): number[] {
  if (signal.length === targetLength) return [...signal];

  const result: number[] = [];
  const ratio = (signal.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;

    if (idx >= signal.length - 1) {
      result.push(signal[signal.length - 1]);
    } else {
      result.push(signal[idx] * (1 - frac) + signal[idx + 1] * frac);
    }
  }

  return result;
}

export function mean(signal: number[]): number {
  return signal.reduce((a, b) => a + b, 0) / signal.length;
}

export function removeMean(signal: number[]): number[] {
  const m = mean(signal);
  return signal.map(v => v - m);
}
