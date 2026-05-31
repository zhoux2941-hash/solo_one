export function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  const hex = clamp(value).toString(16);
  return hex.padStart(2, '0').toUpperCase();
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToString(r: number, g: number, b: number): string {
  return `RGB(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

export function getGlowColor(r: number, g: number, b: number, opacity: number): string {
  return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${opacity})`;
}

export function generateBoxShadows(r: number, g: number, b: number): string {
  const shadows = [
    { blur: 30, spread: 10, opacity: 0.6 },
    { blur: 60, spread: 20, opacity: 0.4 },
    { blur: 100, spread: 40, opacity: 0.2 },
    { blur: 150, spread: 60, opacity: 0.1 },
  ];

  return shadows
    .map(
      (s) =>
        `0 0 ${s.blur}px ${s.spread}px ${getGlowColor(r, g, b, s.opacity)}`
    )
    .join(', ');
}
