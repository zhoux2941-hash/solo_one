export type AbacusType = '2-5' | '1-4';

export type Operator = '+' | '-' | '×' | '÷';

export type Mode = 'manual' | 'calculation' | 'practice';

export interface BeadColumn {
  upper: number[];
  lower: number[];
  columnValue: number;
}

export interface AbacusState {
  type: AbacusType;
  columns: number;
  beads: BeadColumn[];
  currentValue: number;
  displayValue: string;
}

export interface BeadChange {
  columnIndex: number;
  beadType: 'upper' | 'lower';
  beadIndex: number;
  fromPosition: number;
  toPosition: number;
}

export interface CalculationStep {
  description: string;
  formula: string;
  beadChanges: BeadChange[];
}

export interface CalculationState {
  mode: Mode;
  operand1: number | null;
  operand2: number | null;
  operator: Operator | null;
  result: number | null;
  currentStep: number;
  steps: CalculationStep[];
  currentFormula: string | null;
  isAnimating: boolean;
}

export interface PracticeProblem {
  id: number;
  question: string;
  operand1: number;
  operand2: number;
  operator: Operator;
  answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScoreState {
  total: number;
  correct: number;
  currentProblemId: number | null;
  completedProblems: number[];
}

export interface DraggingBead {
  columnIndex: number;
  beadType: 'upper' | 'lower';
  beadIndex: number;
  startY: number;
  currentY: number;
  originalPosition: number;
}

export interface FormulaEntry {
  key: string;
  formula: string;
  description: string;
}
