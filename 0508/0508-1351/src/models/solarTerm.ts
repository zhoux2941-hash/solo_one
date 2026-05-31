export interface SolarTerm {
  id: string;
  name: string;
  phenology: string[];
  farmerProverb: string;
  customs: string;
}

export interface Question {
  id: string;
  solarTerm: SolarTerm;
  options: SolarTerm[];
  correctAnswerId: string;
}

export type GameMode = 'exam' | 'practice';

export interface PracticeRecord {
  solarTermId: string;
  practiceCount: number;
  correctCount: number;
}

export interface PracticeRecords {
  [solarTermId: string]: PracticeRecord;
}

export interface GameState {
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  questions: Question[];
  isGameOver: boolean;
  selectedAnswer: string | null;
  showFeedback: boolean;
  isCorrect: boolean | null;
  gameMode: GameMode;
  practiceSolarTermId: string | null;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { questions: Question[]; gameMode: GameMode; practiceSolarTermId?: string } }
  | { type: 'SUBMIT_ANSWER'; payload: { answerId: string; isCorrect: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESTART_GAME' }
  | { type: 'PRACTICE_AGAIN' };
