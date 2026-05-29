import type { BrailleStrategy } from './BrailleStrategy';
import { currentBrailleMap } from '../data/brailleTypes';

export class CurrentBrailleStrategy implements BrailleStrategy {
  getName(): string {
    return '现行盲文';
  }

  getDescription(): string {
    return '中国大陆现行盲文，基于汉语拼音，采用分词连写规则';
  }

  convertChar(char: string, pinyin: string): string {
    if (pinyin) {
      return currentBrailleMap[pinyin] || currentBrailleMap[pinyin.toLowerCase()] || '';
    }
    return currentBrailleMap[char] || '';
  }
}