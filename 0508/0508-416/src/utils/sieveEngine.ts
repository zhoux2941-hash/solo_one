import { NumberItem, NumberStatus } from '@/types';

export class SieveEngine {
  static generateNumbers(n: number): NumberItem[] {
    const numbers: NumberItem[] = [];
    for (let i = 0; i <= n; i++) {
      numbers.push({
        value: i,
        status: i < 2 ? NumberStatus.COMPOSITE : NumberStatus.UNPROCESSED,
        showStrike: i < 2,
      });
    }
    return numbers;
  }

  static getNextPrime(current: number, numbers: NumberItem[]): number | null {
    for (let i = current + 1; i < numbers.length; i++) {
      if (numbers[i].status === NumberStatus.UNPROCESSED) {
        return i;
      }
    }
    return null;
  }

  static getMultiples(p: number, n: number, numbers: NumberItem[]): number[] {
    const multiples: number[] = [];
    for (let i = p * 2; i <= n; i += p) {
      if (numbers[i].status !== NumberStatus.COMPOSITE && !numbers[i].showStrike) {
        multiples.push(i);
      }
    }
    return multiples;
  }

  static markComposite(numbers: NumberItem[], index: number): NumberItem[] {
    const newNumbers = [...numbers];
    newNumbers[index] = {
      ...newNumbers[index],
      status: NumberStatus.COMPOSITE,
      showStrike: true,
    };
    return newNumbers;
  }

  static markPrime(numbers: NumberItem[], index: number): NumberItem[] {
    const newNumbers = [...numbers];
    newNumbers[index] = {
      ...newNumbers[index],
      status: NumberStatus.PRIME,
    };
    return newNumbers;
  }

  static markBeingMarked(numbers: NumberItem[], index: number): NumberItem[] {
    const newNumbers = [...numbers];
    newNumbers[index] = {
      ...newNumbers[index],
      status: NumberStatus.BEING_MARKED,
    };
    return newNumbers;
  }

  static markCurrent(numbers: NumberItem[], index: number): NumberItem[] {
    const newNumbers = [...numbers];
    newNumbers[index] = {
      ...newNumbers[index],
      status: NumberStatus.CURRENT,
    };
    return newNumbers;
  }

  static countPrimes(numbers: NumberItem[]): number {
    return numbers.filter(
      (n) => n.status === NumberStatus.PRIME || n.status === NumberStatus.CURRENT
    ).length;
  }

  static markRemainingPrimes(numbers: NumberItem[]): NumberItem[] {
    return numbers.map((n) => {
      if (n.status === NumberStatus.UNPROCESSED) {
        return { ...n, status: NumberStatus.PRIME };
      }
      return n;
    });
  }

  static isComplete(p: number, n: number): boolean {
    return p > Math.sqrt(n);
  }

  static calculateTotalSteps(n: number): number {
    if (n < 2) return 0;
    let count = 0;
    const sieve = new Array(n + 1).fill(true);
    sieve[0] = sieve[1] = false;
    for (let p = 2; p * p <= n; p++) {
      if (sieve[p]) {
        count++;
        for (let i = p * p; i <= n; i += p) {
          sieve[i] = false;
        }
      }
    }
    return count;
  }

  static validateN(n: number, min: number, max: number): boolean {
    return Number.isInteger(n) && n >= min && n <= max;
  }
}
