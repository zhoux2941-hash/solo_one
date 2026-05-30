export function generateNoise(length: number, amplitude: number = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    result.push((Math.random() - 0.5) * 2 * amplitude);
  }
  return result;
}

export function generateSineWave(length: number, frequency: number, sampleRate: number, amplitude: number = 1, phase: number = 0): number[] {
  const result: number[] = [];
  const dt = 1 / sampleRate;
  for (let i = 0; i < length; i++) {
    result.push(amplitude * Math.sin(2 * Math.PI * frequency * i * dt + phase));
  }
  return result;
}

export function generateDecayingSine(
  length: number,
  frequency: number,
  sampleRate: number,
  amplitude: number,
  decayRate: number,
  startTime: number = 0
): number[] {
  const result: number[] = new Array(length).fill(0);
  const dt = 1 / sampleRate;
  const startIdx = Math.floor(startTime * sampleRate);
  for (let i = startIdx; i < length; i++) {
    const t = (i - startIdx) * dt;
    result[i] = amplitude * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-decayRate * t);
  }
  return result;
}

export function generateGaussianPacket(
  length: number,
  centerTime: number,
  sigma: number,
  amplitude: number,
  sampleRate: number
): number[] {
  const result: number[] = [];
  const dt = 1 / sampleRate;
  for (let i = 0; i < length; i++) {
    const t = i * dt;
    const envelope = Math.exp(-Math.pow(t - centerTime, 2) / (2 * Math.pow(sigma, 2)));
    result[i] = amplitude * envelope * Math.sin(2 * Math.PI * 5 * (t - centerTime));
  }
  return result;
}

export function generateRickerWavelet(
  length: number,
  centerTime: number,
  peakFreq: number,
  amplitude: number,
  sampleRate: number
): number[] {
  const result: number[] = [];
  const dt = 1 / sampleRate;
  const sigma = 1 / (Math.PI * peakFreq);
  for (let i = 0; i < length; i++) {
    const t = i * dt - centerTime;
    const term = Math.PI * peakFreq * t;
    result[i] = amplitude * (1 - 2 * Math.PI * Math.PI * peakFreq * peakFreq * t * t) *
      Math.exp(-Math.PI * Math.PI * peakFreq * peakFreq * t * t);
  }
  return result;
}

export function addArrays(a: number[], b: number[]): number[] {
  return a.map((val, idx) => val + (b[idx] || 0));
}

export function scaleArray(arr: number[], factor: number): number[] {
  return arr.map(v => v * factor);
}

export function smoothArray(arr: number[], windowSize: number): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(arr.length - 1, i + halfWindow); j++) {
      sum += arr[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

export interface EarthquakeWaveformParams {
  duration: number;
  sampleRate: number;
  magnitude: number;
  pWaveArrival: number;
  sWaveArrival: number;
  noiseLevel: number;
}

export function generateEarthquakeWaveform(params: EarthquakeWaveformParams): {
  north: number[];
  east: number[];
  vertical: number[];
} {
  const { duration, sampleRate, magnitude, pWaveArrival, sWaveArrival, noiseLevel } = params;
  const length = Math.floor(duration * sampleRate);
  const magFactor = Math.pow(10, (magnitude - 5) * 0.1);

  const noise = generateNoise(length, noiseLevel * 0.1);

  const pWaveFreq = 2 + Math.random() * 2;
  const sWaveFreq = 0.8 + Math.random() * 1;

  const pVertical = generateDecayingSine(length, pWaveFreq, sampleRate, magFactor * 0.3, 1.5, pWaveArrival);
  const pNorth = generateDecayingSine(length, pWaveFreq, sampleRate, magFactor * 0.2, 1.2, pWaveArrival + 0.02);
  const pEast = generateDecayingSine(length, pWaveFreq, sampleRate, magFactor * 0.15, 1.3, pWaveArrival + 0.05);

  const sNorth = generateDecayingSine(length, sWaveFreq, sampleRate, magFactor * 0.6, 0.8, sWaveArrival);
  const sEast = generateDecayingSine(length, sWaveFreq, sampleRate, magFactor * 0.65, 0.7, sWaveArrival + 0.03);
  const sVertical = generateDecayingSine(length, sWaveFreq, sampleRate, magFactor * 0.25, 0.9, sWaveArrival + 0.02);

  const codaNorth = generateDecayingSine(length, 0.4, sampleRate, magFactor * 0.4, 0.3, sWaveArrival + 3);
  const codaEast = generateDecayingSine(length, 0.45, sampleRate, magFactor * 0.4, 0.3, sWaveArrival + 3.2);
  const codaVertical = generateDecayingSine(length, 0.5, sampleRate, magFactor * 0.2, 0.35, sWaveArrival + 3.5);

  const north = addArrays(addArrays(pNorth, sNorth), codaNorth);
  const east = addArrays(addArrays(pEast, sEast), codaEast);
  const vertical = addArrays(addArrays(pVertical, sVertical), codaVertical);

  return { north, east, vertical };
}
