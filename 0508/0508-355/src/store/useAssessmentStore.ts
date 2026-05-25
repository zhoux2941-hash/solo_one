import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateAssessment, Answers, AssessmentResult } from "@/utils/calculate";

export interface AssessmentRecord {
  id: string;
  date: string;
  scores: Record<string, number>;
  mainConstitution: string;
  secondaryConstitution: string;
  isPinghe: boolean;
}

interface AssessmentState {
  answers: Answers;
  currentQuestionIndex: number;
  result: AssessmentResult | null;
  assessments: AssessmentRecord[];
  setAnswer: (questionId: number, score: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  submitAssessment: () => void;
  saveAssessment: () => string;
  deleteAssessment: (id: string) => void;
  clearAssessment: () => void;
  resetAnswers: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      answers: {},
      currentQuestionIndex: 0,
      result: null,
      assessments: [],

      setAnswer: (questionId, score) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: score },
        }));
      },

      setCurrentQuestionIndex: (index) => {
        set({ currentQuestionIndex: index });
      },

      submitAssessment: () => {
        const { answers } = get();
        const result = calculateAssessment(answers);
        set({ result });
      },

      saveAssessment: () => {
        const { result, assessments } = get();
        if (!result) return "";

        const newRecord: AssessmentRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          scores: result.scores,
          mainConstitution: result.mainConstitution,
          secondaryConstitution: result.secondaryConstitution,
          isPinghe: result.isPinghe,
        };

        set({
          assessments: [newRecord, ...assessments],
        });

        return newRecord.id;
      },

      deleteAssessment: (id) => {
        set((state) => ({
          assessments: state.assessments.filter((a) => a.id !== id),
        }));
      },

      clearAssessment: () => {
        set({
          answers: {},
          currentQuestionIndex: 0,
          result: null,
        });
      },

      resetAnswers: () => {
        set({
          answers: {},
          currentQuestionIndex: 0,
        });
      },
    }),
    {
      name: "tcm-assessment-store",
      partialize: (state) => ({
        assessments: state.assessments,
      }),
    }
  )
);
