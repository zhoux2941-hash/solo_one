export interface DiffractionParams {
  d: number;
  a: number;
  N: number;
  lambda: number;
}

export const DEFAULT_PARAMS: DiffractionParams = {
  d: 3.0,
  a: 1.0,
  N: 4,
  lambda: 550,
};

export const SODIUM_LINE_1 = 589.0;
export const SODIUM_LINE_2 = 589.6;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function singleSlitIntensity(
  sinTheta: number,
  params: DiffractionParams
): number {
  const a_um = params.a;
  const lambda_um = params.lambda / 1000;
  const beta = Math.PI * a_um * sinTheta / lambda_um;

  if (Math.abs(beta) < 1e-12) return 1.0;
  const sb = Math.sin(beta);
  return (sb / beta) * (sb / beta);
}

export function multiSlitIntensity(
  sinTheta: number,
  params: DiffractionParams
): number {
  if (params.N <= 1) return 1.0;

  const d_um = params.d;
  const lambda_um = params.lambda / 1000;
  const N = params.N;
  const phi = 2 * Math.PI * d_um * sinTheta / lambda_um;
  const halfPhi = phi / 2;
  const sinHalfPhi = Math.sin(halfPhi);

  if (Math.abs(sinHalfPhi) < 1e-12) return 1.0;

  const sinNHalfPhi = Math.sin(N * halfPhi);
  const ratio = sinNHalfPhi / (N * sinHalfPhi);
  return ratio * ratio;
}

export function totalIntensity(
  sinTheta: number,
  params: DiffractionParams
): number {
  if (params.N <= 1) {
    return singleSlitIntensity(sinTheta, params);
  }
  return singleSlitIntensity(sinTheta, params) * multiSlitIntensity(sinTheta, params);
}

export function maxObservableOrder(params: DiffractionParams): number {
  const d_um = params.d;
  const lambda_um = params.lambda / 1000;
  return Math.floor(d_um / lambda_um);
}

export interface PrincipalMaximum {
  order: number;
  thetaDeg: number;
  sinTheta: number;
  isMissing: boolean;
}

export function principalMaxima(params: DiffractionParams): PrincipalMaximum[] {
  if (params.N <= 1) {
    return [{
      order: 0,
      thetaDeg: 0,
      sinTheta: 0,
      isMissing: false,
    }];
  }

  const maxOrder = maxObservableOrder(params);
  const d_um = params.d;
  const lambda_um = params.lambda / 1000;
  const missingSet = new Set(missingOrders(params));
  const result: PrincipalMaximum[] = [];

  for (let m = -maxOrder; m <= maxOrder; m++) {
    const sinTheta = m * lambda_um / d_um;
    if (Math.abs(sinTheta) > 1) continue;
    const thetaDeg = Math.asin(sinTheta) * RAD_TO_DEG;
    result.push({
      order: m,
      thetaDeg,
      sinTheta,
      isMissing: missingSet.has(Math.abs(m)) && m !== 0,
    });
  }

  return result;
}

export function missingOrders(params: DiffractionParams): number[] {
  if (params.N <= 1) return [];

  const ratio = params.d / params.a;
  if (!Number.isFinite(ratio) || ratio <= 0) return [];

  const gcdVal = gcd(Math.round(ratio * 1000), 1000);
  const p = Math.round(ratio * 1000) / gcdVal;
  const maxOrder = maxObservableOrder(params);
  const orders: number[] = [];

  for (let k = 1; k * p <= maxOrder; k++) {
    const m = Math.round(k * p);
    if (m > 0 && m <= maxOrder) {
      orders.push(m);
    }
  }

  return orders;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function computeIntensityCurve(
  params: DiffractionParams,
  numPoints: number = 2000
): { thetaDeg: number; intensity: number; envelope: number }[] {
  const maxOrder = maxObservableOrder(params);
  const maxTheta = maxOrder > 0
    ? Math.asin(Math.min(1, params.lambda / 1000 / params.d * maxOrder)) * RAD_TO_DEG + 2
    : 10;
  const thetaMax = Math.min(maxTheta, 90);

  const points: { thetaDeg: number; intensity: number; envelope: number }[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const thetaDeg = -thetaMax + (2 * thetaMax * i) / numPoints;
    const sinTheta = Math.sin(thetaDeg * DEG_TO_RAD);
    const envelope = singleSlitIntensity(sinTheta, params);
    const intensity = totalIntensity(sinTheta, params);
    points.push({ thetaDeg, intensity, envelope });
  }

  return points;
}

export interface SingleSlitMinimum {
  order: number;
  thetaDeg: number;
  sinTheta: number;
}

export function singleSlitMinima(params: DiffractionParams): SingleSlitMinimum[] {
  const a_um = params.a;
  const lambda_um = params.lambda / 1000;
  const result: SingleSlitMinimum[] = [];
  const maxK = Math.floor(a_um / lambda_um);

  result.push({
    order: 0,
    thetaDeg: 0,
    sinTheta: 0,
  });

  for (let k = 1; k <= maxK; k++) {
    const sinTheta = k * lambda_um / a_um;
    if (Math.abs(sinTheta) > 1) continue;
    const thetaDeg = Math.asin(sinTheta) * RAD_TO_DEG;
    result.push({
      order: k,
      thetaDeg,
      sinTheta,
    });
  }

  return result;
}

export function wavelengthToColor(lambdaNm: number): string {
  let r = 0, g = 0, b = 0;

  if (lambdaNm >= 380 && lambdaNm < 440) {
    r = -(lambdaNm - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (lambdaNm >= 440 && lambdaNm < 490) {
    r = 0;
    g = (lambdaNm - 440) / (490 - 440);
    b = 1;
  } else if (lambdaNm >= 490 && lambdaNm < 510) {
    r = 0;
    g = 1;
    b = -(lambdaNm - 510) / (510 - 490);
  } else if (lambdaNm >= 510 && lambdaNm < 580) {
    r = (lambdaNm - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (lambdaNm >= 580 && lambdaNm < 645) {
    r = 1;
    g = -(lambdaNm - 645) / (645 - 580);
    b = 0;
  } else if (lambdaNm >= 645 && lambdaNm <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  let factor = 0;
  if (lambdaNm >= 380 && lambdaNm < 420) {
    factor = 0.3 + 0.7 * (lambdaNm - 380) / (420 - 380);
  } else if (lambdaNm >= 420 && lambdaNm <= 700) {
    factor = 1.0;
  } else if (lambdaNm > 700 && lambdaNm <= 780) {
    factor = 0.3 + 0.7 * (780 - lambdaNm) / (780 - 700);
  }

  r = Math.round(255 * Math.pow(r * factor, 0.8));
  g = Math.round(255 * Math.pow(g * factor, 0.8));
  b = Math.round(255 * Math.pow(b * factor, 0.8));

  return `rgb(${r}, ${g}, ${b})`;
}
