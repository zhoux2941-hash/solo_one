export function calculateEpicenterDistance(psDifference: number): number {
  const P_WAVE_VELOCITY = 8;
  return psDifference * P_WAVE_VELOCITY;
}

export function calculatePSDifference(pTime: number, sTime: number): number {
  return Math.abs(sTime - pTime);
}

export function estimateMagnitude(
  maxAmplitude: number,
  epicenterDistance: number,
  component: 'vertical' | 'horizontal' = 'vertical'
): number {
  const amplitudeInMicrons = Math.abs(maxAmplitude) * 1000;

  if (amplitudeInMicrons <= 0) {
    return 0;
  }

  const logA = Math.log10(amplitudeInMicrons);
  const distanceCorrection = Math.log10(epicenterDistance / 100) * 0.15;
  const componentFactor = component === 'vertical' ? 0 : 0.1;

  let magnitude = logA + distanceCorrection + componentFactor;

  if (magnitude < 0) magnitude = 0;
  if (magnitude > 10) magnitude = 10;

  return Math.round(magnitude * 100) / 100;
}

export function getMagnitudeDescription(magnitude: number): {
  level: string;
  color: string;
  description: string;
} {
  if (magnitude < 3) {
    return {
      level: '微震',
      color: '#22c55e',
      description: '通常感觉不到，只有仪器能记录到'
    };
  } else if (magnitude < 4.5) {
    return {
      level: '小震',
      color: '#84cc16',
      description: '室内少数人能感觉到，悬挂物轻微摆动'
    };
  } else if (magnitude < 6) {
    return {
      level: '中强震',
      color: '#eab308',
      description: '室内多数人、室外少数人能感觉到'
    };
  } else if (magnitude < 7) {
    return {
      level: '强震',
      color: '#f97316',
      description: '人站立不稳，家畜外逃，器皿翻落'
    };
  } else if (magnitude < 8) {
    return {
      level: '大地震',
      color: '#ef4444',
      description: '房屋多有损坏，路基塌方，地下管道破裂'
    };
  } else {
    return {
      level: '巨大地震',
      color: '#dc2626',
      description: '房屋建筑物倒塌，地形巨变，伤亡惨重'
    };
  }
}

export function getMagnitudeColor(magnitude: number): string {
  return getMagnitudeDescription(magnitude).color;
}

export function calculateMaxAmplitude(signal: number[]): number {
  if (signal.length === 0) return 0;
  return Math.max(...signal.map(Math.abs));
}

export function calculateRMS(signal: number[]): number {
  if (signal.length === 0) return 0;
  const sum = signal.reduce((acc, val) => acc + val * val, 0);
  return Math.sqrt(sum / signal.length);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(1)} m`;
  } else if (km < 1000) {
    return `${km.toFixed(1)} km`;
  } else {
    return `${(km / 1000).toFixed(2)} ×10³ km`;
  }
}

export interface AnalysisResult {
  pTime: number | null;
  sTime: number | null;
  psDifference: number | null;
  epicenterDistance: number | null;
  estimatedMagnitude: number | null;
  maxAmplitude: number;
}

export function computeAnalysisResult(
  pAnnotation: number | null,
  sAnnotation: number | null,
  waveformData: number[]
): AnalysisResult {
  const maxAmplitude = calculateMaxAmplitude(waveformData);

  if (pAnnotation === null || sAnnotation === null) {
    return {
      pTime: pAnnotation,
      sTime: sAnnotation,
      psDifference: null,
      epicenterDistance: null,
      estimatedMagnitude: null,
      maxAmplitude
    };
  }

  const psDifference = calculatePSDifference(pAnnotation, sAnnotation);
  const epicenterDistance = calculateEpicenterDistance(psDifference);
  const estimatedMagnitude = estimateMagnitude(maxAmplitude, epicenterDistance);

  return {
    pTime: pAnnotation,
    sTime: sAnnotation,
    psDifference,
    epicenterDistance,
    estimatedMagnitude,
    maxAmplitude
  };
}
