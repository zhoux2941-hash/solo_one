import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question, WrongQuestion, ExamRecord, StudyStats } from '@/types';
import { questions as allQuestions } from '@/data/questions';

interface AppState {
  questions: Question[];
  wrongQuestions: WrongQuestion[];
  examRecords: ExamRecord[];
  studyStats: StudyStats;
  addWrongQuestion: (questionId: number) => void;
  addExamRecord: (record: ExamRecord) => void;
  updateStudyStats: (isCorrect: boolean) => void;
  clearWrongQuestion: (questionId: number) => void;
  getQuestionById: (id: number) => Question | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      questions: allQuestions,
      wrongQuestions: [],
      examRecords: [],
      studyStats: {
        totalPractice: 0,
        correctCount: 0,
        wrongCount: 0
      },
      addWrongQuestion: (questionId) => {
        set((state) => {
          const existing = state.wrongQuestions.find(wq => wq.questionId === questionId);
          if (existing) {
            return {
              wrongQuestions: state.wrongQuestions.map(wq =>
                wq.questionId === questionId
                  ? { ...wq, wrongCount: wq.wrongCount + 1, lastWrongDate: new Date().toISOString() }
                  : wq
              )
            };
          }
          return {
            wrongQuestions: [
              ...state.wrongQuestions,
              { questionId, wrongCount: 1, lastWrongDate: new Date().toISOString() }
            ]
          };
        });
      },
      addExamRecord: (record) => {
        set((state) => ({
          examRecords: [...state.examRecords, record]
        }));
      },
      updateStudyStats: (isCorrect) => {
        set((state) => ({
          studyStats: {
            totalPractice: state.studyStats.totalPractice + 1,
            correctCount: state.studyStats.correctCount + (isCorrect ? 1 : 0),
            wrongCount: state.studyStats.wrongCount + (isCorrect ? 0 : 1)
          }
        }));
      },
      clearWrongQuestion: (questionId) => {
        set((state) => ({
          wrongQuestions: state.wrongQuestions.filter(wq => wq.questionId !== questionId)
        }));
      },
      getQuestionById: (id) => {
        return get().questions.find(q => q.id === id);
      }
    }),
    {
      name: 'jiaoyi-practice-storage',
      partialize: (state) => ({
        wrongQuestions: state.wrongQuestions,
        examRecords: state.examRecords,
        studyStats: state.studyStats
      })
    }
  )
);
