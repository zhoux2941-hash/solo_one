import type { RGB, CMYK, Lab, XYZ, HSL } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHex(rgb: RGB): string {
  const r = clamp(Math.round(rgb.r), 0, 255);
  const g = clamp(Math.round(rgb.g), 0, 255);
  const b = clamp(Math.round(rgb.b), 0, 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k) * 100;
  const m = (1 - g - k) / (1 - k) * 100;
  const y = (1 - b - k) / (1 - k) * 100;

  return {
    c: clamp(Math.round(c * 100) / 100, 0, 100),
    m: clamp(Math.round(m * 100) / 100, 0, 100),
    y: clamp(Math.round(y * 100) / 100, 0, 100),
    k: clamp(Math.round(k * 10000) / 100, 0, 100)
  };
}

function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  const r = (1 - c) * (1 - k) * 255;
  const g = (1 - m) * (1 - k) * 255;
  const b = (1 - y) * (1 - k) * 255;

  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255)
  };
}

function rgbToXyz(rgb: RGB): XYZ {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  return {
    X: Math.round((r * 0.4124 + g * 0.3576 + b * 0.1805) * 100) / 100,
    Y: Math.round((r * 0.2126 + g * 0.7152 + b * 0.0722) * 100) / 100,
    Z: Math.round((r * 0.0193 + g * 0.1192 + b * 0.9505) * 100) / 100
  };
}

function xyzToRgb(xyz: XYZ): RGB {
  let x = xyz.X / 100;
  let y = xyz.Y / 100;
  let z = xyz.Z / 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: clamp(Math.round(r * 255), 0, 255),
    g: clamp(Math.round(g * 255), 0, 255),
    b: clamp(Math.round(b * 255), 0, 255)
  };
}

function xyzToLab(xyz: XYZ): Lab {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x = xyz.X / refX;
  let y = xyz.Y / refY;
  let z = xyz.Z / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  return {
    L: Math.round((116 * y - 16) * 100) / 100,
    a: Math.round((500 * (x - y)) * 100) / 100,
    b: Math.round((200 * (y - z)) * 100) / 100
  };
}

function labToXyz(lab: Lab): XYZ {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  const epsilon = 0.008856;
  const kappa = 903.3;

  let y = (lab.L + 16) / 116;
  let x = lab.a / 500 + y;
  let z = y - lab.b / 200;

  const y3 = Math.pow(y, 3);
  const x3 = Math.pow(x, 3);
  const z3 = Math.pow(z, 3);

  y = y3 > epsilon ? y3 : (116 * y - 16) / kappa;
  x = x3 > epsilon ? x3 : (116 * x - 16) / kappa;
  z = z3 > epsilon ? z3 : (116 * z - 16) / kappa;

  return {
    X: Math.round(x * refX * 100) / 100,
    Y: Math.round(y * refY * 100) / 100,
    Z: Math.round(z * refZ * 100) / 100
  };
}

function rgbToLab(rgb: RGB): Lab {
  return xyzToLab(rgbToXyz(rgb));
}

function labToRgb(lab: Lab): RGB {
  return xyzToRgb(labToXyz(lab));
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function deltaE2000(lab1: Lab, lab2: Lab): number {
  const L1 = lab1.L;
  const a1 = lab1.a;
  const b1 = lab1.b;
  const L2 = lab2.L;
  const a2 = lab2.a;
  const b2 = lab2.b;

  const avgLp = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p);
  if (h1p < 0) h1p += 2 * Math.PI;
  let h2p = Math.atan2(b2, a2p);
  if (h2p < 0) h2p += 2 * Math.PI;

  let avghp = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > Math.PI) {
    avghp += Math.PI;
    if (avghp > 2 * Math.PI) avghp -= 2 * Math.PI;
  }

  const T = 1 - 0.17 * Math.cos(avghp - Math.PI / 6) + 0.24 * Math.cos(2 * avghp)
    + 0.32 * Math.cos(3 * avghp + Math.PI / 30) - 0.2 * Math.cos(4 * avghp - 21 * Math.PI / 60);

  let deltaHp = h2p - h1p;
  if (Math.abs(deltaHp) > Math.PI) {
    if (h2p <= h1p) deltaHp += 2 * Math.PI;
    else deltaHp -= 2 * Math.PI;
  }

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;
  deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltaHp / 2);

  const SL = 1 + (0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;

  const deltaTheta = 30 * Math.PI / 180 * Math.exp(-Math.pow((avghp - 275 * Math.PI / 180) / (25 * Math.PI / 180), 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * deltaTheta);

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const result = Math.sqrt(
    Math.pow(deltaLp / (kL * SL), 2) +
    Math.pow(deltaCp / (kC * SC), 2) +
    Math.pow(deltaHp / (kH * SH), 2) +
    RT * (deltaCp / (kC * SC)) * (deltaHp / (kH * SH))
  );

  return Math.round(result * 100) / 100;
}

function getDifferenceLevel(deltaE: number): string {
  if (deltaE <= 1) return '几乎无差异';
  if (deltaE <= 2) return '极小差异';
  if (deltaE <= 5) return '中等差异';
  if (deltaE <= 10) return '明显差异';
  return '很大差异';
}

function cielabDistance(lab1: Lab, lab2: Lab): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

function mixColors(rgb1: RGB, rgb2: RGB, ratio: number = 0.5): RGB {
  return {
    r: Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio),
    g: Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio),
    b: Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio)
  };
}

function overprintMix(rgb1: RGB, opacity1: number, rgb2: RGB, opacity2: number): RGB {
  const alpha1 = opacity1 / 100;
  const alpha2 = opacity2 / 100;
  const alpha = alpha1 + alpha2 * (1 - alpha1);

  if (alpha === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Math.round((rgb1.r * alpha1 + rgb2.r * alpha2 * (1 - alpha1)) / alpha),
    g: Math.round((rgb1.g * alpha1 + rgb2.g * alpha2 * (1 - alpha1)) / alpha),
    b: Math.round((rgb1.b * alpha1 + rgb2.b * alpha2 * (1 - alpha1)) / alpha)
  };
}

function rgbToAll(rgb: RGB) {
  const cmyk = rgbToCmyk(rgb);
  const xyz = rgbToXyz(rgb);
  const lab = rgbToLab(rgb);
  const hsl = rgbToHsl(rgb);
  const hex = rgbToHex(rgb);
  return { rgb, cmyk, xyz, lab, hsl, hex };
}

function cmykToAll(cmyk: CMYK) {
  const rgb = cmykToRgb(cmyk);
  return rgbToAll(rgb);
}

function labToAll(lab: Lab) {
  const rgb = labToRgb(lab);
  return rgbToAll(rgb);
}

function hexToAll(hex: string) {
  const rgb = hexToRgb(hex);
  return rgbToAll(rgb);
}

export const colorAlgorithms = {
  rgbToHex,
  hexToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  rgbToLab,
  labToRgb,
  rgbToHsl,
  hslToRgb,
  deltaE2000,
  getDifferenceLevel,
  cielabDistance,
  mixColors,
  overprintMix,
  rgbToAll,
  cmykToAll,
  labToAll,
  hexToAll
};
