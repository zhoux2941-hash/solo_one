import { useState, useEffect } from 'react';

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return Number(num.toFixed(decimals)).toString();
}

export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function validateRgbInput(value: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(255, num));
}

export function validateCmykInput(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

export function formatPantoneCode(code: string): string {
  let clean = code.toUpperCase().trim();
  if (!clean.startsWith('PANTONE ')) {
    clean = 'PANTONE ' + clean;
  }
  return clean;
}
