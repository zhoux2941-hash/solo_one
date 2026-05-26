export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimalPlaces: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimalPlaces));
}

export function generateNumber(min: number = 0, max: number = 100, isInteger: boolean = true, decimalPlaces: number = 2): number {
  if (isInteger) {
    return randomInt(Math.ceil(min), Math.floor(max));
  }
  return randomFloat(min, max, decimalPlaces);
}

export function generateBoolean(trueProbability: number = 0.5): boolean {
  return Math.random() < trueProbability;
}
