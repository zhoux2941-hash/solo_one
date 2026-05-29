import { defaultCodec } from './MorseCodec';

export const DEFAULT_MORSE_CODE = defaultCodec.getDefaultMappings();

export interface CustomMappings {
  [key: string]: string;
}

export function getCustomMappings(): CustomMappings {
  return defaultCodec.getCustomMappings();
}

export function setCustomMappings(mappings: CustomMappings): void {
  defaultCodec.setCustomMappings(mappings);
}

export function addCustomMapping(char: string, code: string): void {
  defaultCodec.addCustomMapping(char, code);
}

export function removeCustomMapping(char: string): void {
  defaultCodec.removeCustomMapping(char);
}

export function clearCustomMappings(): void {
  defaultCodec.clearCustomMappings();
}

export function getMorseCode(): Record<string, string> {
  return defaultCodec.getDefaultMappings();
}

export function getMorseCodeReverse(): Record<string, string> {
  const code = defaultCodec.getDefaultMappings();
  const reverse: Record<string, string> = {};
  Object.entries(code).forEach(([char, morse]) => {
    reverse[morse] = char;
  });
  return reverse;
}

export const ALPHABET = Object.keys(DEFAULT_MORSE_CODE).filter(c => c !== ' ' && c.length === 1 && /^[A-Z0-9]$/.test(c));

export function textToMorse(text: string): string {
  return defaultCodec.encode(text);
}

export function morseToText(morse: string): string {
  return defaultCodec.decode(morse);
}

export function getRandomChar(): { char: string; code: string } {
  return defaultCodec.getRandomChar();
}

export function hasMapping(char: string): boolean {
  return defaultCodec.hasMapping(char);
}

export function getSupportedChars(): string[] {
  return defaultCodec.getSupportedChars();
}
