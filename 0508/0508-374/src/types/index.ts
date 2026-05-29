export type ModeType = 'encode' | 'decode' | 'train';

export interface TrainingState {
  currentChar: string;
  currentMorse: string;
  userInput: string;
  isPlaying: boolean;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  successRate: number;
  streak: number;
  lastResult: 'correct' | 'wrong' | null;
}

export interface AudioPlayer {
  play: (morseCode: string) => void;
  stop: () => void;
  isPlaying: boolean;
}
