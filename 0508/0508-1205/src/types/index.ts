export interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  chapters: string[];
}

export interface WrongQuestion {
  questionId: number;
  wrongCount: number;
  lastWrongDate: string;
}

export interface ExamRecord {
  id: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  date: string;
  wrongQuestions: number[];
  chapterScores: Record<string, { correct: number; total: number }>;
}

export interface StudyStats {
  totalPractice: number;
  correctCount: number;
  wrongCount: number;
}

export interface AppState {
  questions: Question[];
  wrongQuestions: WrongQuestion[];
  examRecords: ExamRecord[];
  studyStats: StudyStats;
}
