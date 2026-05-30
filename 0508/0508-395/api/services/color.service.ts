import { colorAlgorithms } from '../../shared/color-algorithms';
import * as pantoneRepo from '../repositories/pantone.repository';
import type { RGB, CMYK, Lab, ColorConversionResult, DeltaEResult, PantoneColor, OverprintResult } from '../../shared/types';

export function convertRgbToAll(rgb: RGB): ColorConversionResult {
  const result = colorAlgorithms.rgbToAll(rgb);
  const pantoneMatch = pantoneRepo.findClosestByRgb(rgb);
  
  return {
    ...result,
    pantoneMatch
  };
}

export function convertCmykToAll(cmyk: CMYK): ColorConversionResult {
  const rgb = colorAlgorithms.cmykToRgb(cmyk);
  return convertRgbToAll(rgb);
}

export function convertPantoneToAll(code: string): ColorConversionResult | null {
  const pantone = pantoneRepo.findByCode(code);
  if (!pantone) return null;
  
  const result = colorAlgorithms.rgbToAll(pantone.rgb);
  
  return {
    ...result,
    pantoneMatch: pantone
  };
}

export function convertHexToAll(hex: string): ColorConversionResult {
  const rgb = colorAlgorithms.hexToRgb(hex);
  return convertRgbToAll(rgb);
}

export function calculateDeltaE2000(lab1: Lab, lab2: Lab): DeltaEResult {
  const deltaE = colorAlgorithms.deltaE2000(lab1, lab2);
  const difference = colorAlgorithms.getDifferenceLevel(deltaE);
  
  return {
    deltaE2000: deltaE,
    difference,
    lab1,
    lab2
  };
}

export function calculateDeltaEByRgb(rgb1: RGB, rgb2: RGB): DeltaEResult {
  const lab1 = colorAlgorithms.rgbToLab(rgb1);
  const lab2 = colorAlgorithms.rgbToLab(rgb2);
  return calculateDeltaE2000(lab1, lab2);
}

export function searchPantone(query: string, limit: number = 50): PantoneColor[] {
  return pantoneRepo.search(query, limit);
}

export function listPantone(page: number = 1, pageSize: number = 50, category?: string) {
  return pantoneRepo.list(page, pageSize, category);
}

export function matchPantoneByRgb(rgb: RGB, limit: number = 5): PantoneColor[] {
  return pantoneRepo.findByRgb(rgb, limit);
}

export function getCategories(): string[] {
  return pantoneRepo.getCategories();
}

export function getPresetColors(): PantoneColor[] {
  return pantoneRepo.getPresetColors();
}

export function calculateOverprint(
  color1Code: string,
  color2Code: string,
  opacity1: number = 100,
  opacity2: number = 100
): OverprintResult | null {
  const color1 = pantoneRepo.findByCode(color1Code);
  const color2 = pantoneRepo.findByCode(color2Code);
  
  if (!color1 || !color2) return null;
  
  const mixedRGB = colorAlgorithms.overprintMix(
    color1.rgb, opacity1,
    color2.rgb, opacity2
  );
  
  const mixedHex = colorAlgorithms.rgbToHex(mixedRGB);
  const mixedCMYK = colorAlgorithms.rgbToCmyk(mixedRGB);
  const mixedLab = colorAlgorithms.rgbToLab(mixedRGB);
  
  return {
    color1,
    color2,
    opacity1,
    opacity2,
    mixedRGB,
    mixedHex,
    mixedCMYK,
    mixedLab
  };
}

export function getColorsByIds(ids: number[]): PantoneColor[] {
  return pantoneRepo.findByIds(ids);
}

export function validateRgb(rgb: RGB): boolean {
  return Number.isInteger(rgb.r) && rgb.r >= 0 && rgb.r <= 255 &&
         Number.isInteger(rgb.g) && rgb.g >= 0 && rgb.g <= 255 &&
         Number.isInteger(rgb.b) && rgb.b >= 0 && rgb.b <= 255;
}

export function validateCmyk(cmyk: CMYK): boolean {
  return cmyk.c >= 0 && cmyk.c <= 100 &&
         cmyk.m >= 0 && cmyk.m <= 100 &&
         cmyk.y >= 0 && cmyk.y <= 100 &&
         cmyk.k >= 0 && cmyk.k <= 100;
}

export function validateHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
