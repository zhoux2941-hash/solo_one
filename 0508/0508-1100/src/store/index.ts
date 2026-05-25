import { create } from 'zustand';
import type { Score, AnnotationVersion, Annotation, Conflict, MissingAnnotation, Teacher, TeacherScoreSummary, TeacherConflictSummary } from '../types';

interface AppState {
  scores: Score[];
  currentScore: Score | null;
  versions: AnnotationVersion[];
  annotations: Annotation[];
  conflicts: Conflict[];
  missingAnnotations: MissingAnnotation[];
  selectedVersionId: string | null;
  mergedView: boolean;
  loading: boolean;
  error: string | null;
  viewMode: 'byScore' | 'byTeacher';
  currentTeacherId: string | null;
  teachers: Array<{ teacherId: string; teacherName: string; annotationCount: number; scoreCount: number }>;
  currentTeacher: Teacher | null;
  teacherScores: TeacherScoreSummary[];
  teacherAnnotations: Annotation[];
  teacherConflicts: TeacherConflictSummary[];
  selectedTeacherScoreId: string | null;
  compareMode: boolean;

  setScores: (scores: Score[]) => void;
  setCurrentScore: (score: Score | null) => void;
  setVersions: (versions: AnnotationVersion[]) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setConflicts: (conflicts: Conflict[]) => void;
  setMissingAnnotations: (missing: MissingAnnotation[]) => void;
  setSelectedVersionId: (id: string | null) => void;
  setMergedView: (merged: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setViewMode: (mode: 'byScore' | 'byTeacher') => void;
  setCurrentTeacherId: (id: string | null) => void;
  setTeachers: (teachers: any[]) => void;
  setCurrentTeacher: (teacher: Teacher | null) => void;
  setTeacherScores: (scores: TeacherScoreSummary[]) => void;
  setTeacherAnnotations: (annotations: Annotation[]) => void;
  setTeacherConflicts: (conflicts: TeacherConflictSummary[]) => void;
  setSelectedTeacherScoreId: (id: string | null) => void;
  setCompareMode: (compare: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  scores: [],
  currentScore: null,
  versions: [],
  annotations: [],
  conflicts: [],
  missingAnnotations: [],
  selectedVersionId: null,
  mergedView: true,
  loading: false,
  error: null,
  viewMode: 'byScore',
  currentTeacherId: null,
  teachers: [],
  currentTeacher: null,
  teacherScores: [],
  teacherAnnotations: [],
  teacherConflicts: [],
  selectedTeacherScoreId: null,
  compareMode: false,

  setScores: (scores) => set({ scores }),
  setCurrentScore: (score) => set({ currentScore: score }),
  setVersions: (versions) => set({ versions }),
  setAnnotations: (annotations) => set({ annotations }),
  setConflicts: (conflicts) => set({ conflicts }),
  setMissingAnnotations: (missing) => set({ missingAnnotations: missing }),
  setSelectedVersionId: (id) => set({ selectedVersionId: id }),
  setMergedView: (merged) => set({ mergedView: merged }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentTeacherId: (id) => set({ currentTeacherId: id }),
  setTeachers: (teachers) => set({ teachers }),
  setCurrentTeacher: (teacher) => set({ currentTeacher: teacher }),
  setTeacherScores: (scores) => set({ teacherScores: scores }),
  setTeacherAnnotations: (annotations) => set({ teacherAnnotations: annotations }),
  setTeacherConflicts: (conflicts) => set({ teacherConflicts: conflicts }),
  setSelectedTeacherScoreId: (id) => set({ selectedTeacherScoreId: id }),
  setCompareMode: (compare) => set({ compareMode: compare }),
}));