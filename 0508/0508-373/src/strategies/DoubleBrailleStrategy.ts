import type { BrailleStrategy } from './BrailleStrategy';
import { doubleBrailleMap } from '../data/brailleTypes';

export class DoubleBrailleStrategy implements BrailleStrategy {
  getName(): string {
    return '双拼盲文';
  }

  getDescription(): string {
    return '双拼盲文方案，声母韵母各占一方';
  }

  convertChar(char: string, pinyin: string): string {
    if (pinyin) {
      return doubleBrailleMap[pinyin] || doubleBrailleMap[pinyin.toLowerCase()] || '';
    }
    return doubleBrailleMap[char] || '';
  }
}