export interface WordData {
  word: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
}

export interface SyllableResult {
  word: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
  syllableDisplay: string;
  stressedDisplay: string;
}
