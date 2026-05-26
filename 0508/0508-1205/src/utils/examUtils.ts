import { Question, ExamRecord } from '@/types';

export function generateExamId(): string {
  return `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateScore(correctCount: number, totalQuestions: number): number {
  return Math.round((correctCount / totalQuestions) * 100);
}

export function isPass(score: number): boolean {
  return score >= 90;
}

export function calculateChapterScores(
  questions: Question[],
  userAnswers: Record<number, string | null>,
  correctAnswers: Record<number, string>
): Record<string, { correct: number; total: number }> {
  const chapterScores: Record<string, { correct: number; total: number }> = {};

  questions.forEach((question) => {
    const isCorrect = userAnswers[question.id] === correctAnswers[question.id];
    
    question.chapters.forEach((chapter) => {
      if (!chapterScores[chapter]) {
        chapterScores[chapter] = { correct: 0, total: 0 };
      }
      chapterScores[chapter].total++;
      if (isCorrect) {
        chapterScores[chapter].correct++;
      }
    });
  });

  return chapterScores;
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getRecentExamRecords(records: ExamRecord[], limit: number = 10): ExamRecord[] {
  return [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
