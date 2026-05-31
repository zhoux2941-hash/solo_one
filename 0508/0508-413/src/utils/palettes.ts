import { PaletteName } from '../types/fractal';

function lerpColor(color1: number[], color2: number[], t: number): number[] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t),
  ];
}

function createGradientPalette(stops: { position: number; color: number[] }[]): Uint8ClampedArray {
  const palette = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let stopIndex = 0;
    while (stopIndex < stops.length - 1 && t > stops[stopIndex + 1].position) {
      stopIndex++;
    }
    const start = stops[stopIndex];
    const end = stops[Math.min(stopIndex + 1, stops.length - 1)];
    const localT = end.position > start.position 
      ? (t - start.position) / (end.position - start.position) 
      : 0;
    const color = lerpColor(start.color, end.color, localT);
    palette[i * 3] = color[0];
    palette[i * 3 + 1] = color[1];
    palette[i * 3 + 2] = color[2];
  }
  return palette;
}

const palettes: Record<PaletteName, Uint8ClampedArray> = {
  grayscale: createGradientPalette([
    { position: 0, color: [0, 0, 0] },
    { position: 1, color: [255, 255, 255] },
  ]),

  fire: createGradientPalette([
    { position: 0, color: [0, 0, 0] },
    { position: 0.2, color: [139, 0, 0] },
    { position: 0.4, color: [255, 69, 0] },
    { position: 0.6, color: [255, 165, 0] },
    { position: 0.8, color: [255, 255, 0] },
    { position: 1, color: [255, 255, 255] },
  ]),

  ocean: createGradientPalette([
    { position: 0, color: [0, 0, 0] },
    { position: 0.25, color: [0, 20, 60] },
    { position: 0.5, color: [0, 80, 150] },
    { position: 0.75, color: [0, 180, 200] },
    { position: 1, color: [200, 240, 255] },
  ]),

  rainbow: createGradientPalette([
    { position: 0, color: [255, 0, 0] },
    { position: 0.17, color: [255, 127, 0] },
    { position: 0.33, color: [255, 255, 0] },
    { position: 0.5, color: [0, 255, 0] },
    { position: 0.67, color: [0, 0, 255] },
    { position: 0.83, color: [75, 0, 130] },
    { position: 1, color: [148, 0, 211] },
  ]),

  neon: createGradientPalette([
    { position: 0, color: [10, 10, 30] },
    { position: 0.2, color: [255, 0, 128] },
    { position: 0.4, color: [0, 255, 255] },
    { position: 0.6, color: [128, 0, 255] },
    { position: 0.8, color: [0, 255, 128] },
    { position: 1, color: [255, 255, 0] },
  ]),

  vintage: createGradientPalette([
    { position: 0, color: [20, 15, 10] },
    { position: 0.25, color: [80, 60, 40] },
    { position: 0.5, color: [150, 120, 80] },
    { position: 0.75, color: [200, 170, 120] },
    { position: 1, color: [240, 220, 180] },
  ]),
};

export const paletteOptions: { value: PaletteName; label: string }[] = [
  { value: 'grayscale', label: '灰度' },
  { value: 'fire', label: '火焰' },
  { value: 'ocean', label: '海洋' },
  { value: 'rainbow', label: '彩虹' },
  { value: 'neon', label: '霓虹' },
  { value: 'vintage', label: '复古' },
];

export function getPalette(name: PaletteName): Uint8ClampedArray {
  return palettes[name] || palettes.fire;
}
