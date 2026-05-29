export interface BrailleStrategy {
  getName(): string;
  getDescription(): string;
  convertChar(char: string, pinyin: string): string;
}