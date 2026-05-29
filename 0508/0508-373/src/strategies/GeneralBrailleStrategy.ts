import type { BrailleStrategy } from './BrailleStrategy';
import { generalBrailleMap } from '../data/brailleTypes';

export class GeneralBrailleStrategy implements BrailleStrategy {
  getName(): string {
    return '通用盲文';
  }

  getDescription(): string {
    return '通用盲文方案，更符合普通话发音习惯';
  }

  convertChar(char: string, pinyin: string): string {
    if (pinyin) {
      return generalBrailleMap[pinyin] || generalBrailleMap[pinyin.toLowerCase()] || '';
    }
    return generalBrailleMap[char] || '';
  }
}