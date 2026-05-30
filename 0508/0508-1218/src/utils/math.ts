export function mod2pi(x: number): number {
  return x - Math.floor(x / (2 * Math.PI)) * 2 * Math.PI;
}

export function deg2rad(d: number): number {
  return d * (Math.PI / 180);
}

export function rad2deg(r: number): number {
  return r * (180 / Math.PI);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function fmod2p(x: number): number {
  let result = x % (2 * Math.PI);
  if (result < 0) result += 2 * Math.PI;
  return result;
}
