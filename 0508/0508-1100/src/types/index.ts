export interface Score {
  id: string;
  title: string;
  composer: string;
  instrument: string;
  difficulty: 'elementary' | 'intermediate' | 'advanced';
  svgContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationVersion {
  id: string;
  scoreId: string;
  teacherId: string;
  teacherName: string;
  versionNumber: number;
  color: string;
  createdAt: string;
  isFinal: boolean;
}

export interface Annotation {
  id: string;
  versionId: string;
  scoreId: string;
  type: 'fingering' | 'phrasing' | 'oral';
  measureNumber: number;
  beatPosition: number;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Conflict {
  id: string;
  scoreId: string;
  measureNumber: number;
  type: 'fingering' | 'phrasing' | 'oral';
  annotations: Annotation[];
  resolved: boolean;
  resolvedVersionId?: string;
  createdAt: string;
}

export interface MissingAnnotation {
  id: string;
  scoreId: string;
  measureNumber: number;
  type: 'fingering' | 'phrasing' | 'oral';
  presentInVersions: string[];
  missingInVersions: string[];
  annotation: Annotation;
}

export interface ExportConfig {
  scoreId: string;
  format: 'pdf' | 'docx';
  includeConflicts: boolean;
  includeOralNotes: boolean;
  includeFingerings: boolean;
  finalVersionId?: string;
  pageSize: 'A4' | 'Letter';
}

export type AnnotationType = 'fingering' | 'phrasing' | 'oral';

export interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  school?: string;
  title?: string;
  annotationCount: number;
  scoreCount: number;
  conflictCount: number;
  createdAt: string;
}

export interface TeacherScoreSummary {
  scoreId: string;
  scoreTitle: string;
  composer: string;
  annotationCount: number;
  lastAnnotatedAt: string;
  hasConflicts: boolean;
  conflictCount: number;
}

export interface TeacherConflictSummary {
  id: string;
  scoreId: string;
  scoreTitle: string;
  measureNumber: number;
  type: AnnotationType;
  teacherAnnotation: Annotation;
  otherAnnotations: Annotation[];
  resolved: boolean;
}
