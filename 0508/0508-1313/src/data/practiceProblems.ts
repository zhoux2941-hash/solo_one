import type { PracticeProblem } from '../types';

export const practiceProblems: PracticeProblem[] = [
  {
    id: 1,
    question: '3 + 2 = ?',
    operand1: 3,
    operand2: 2,
    operator: '+',
    answer: 5,
    difficulty: 'easy',
  },
  {
    id: 2,
    question: '7 + 5 = ?',
    operand1: 7,
    operand2: 5,
    operator: '+',
    answer: 12,
    difficulty: 'easy',
  },
  {
    id: 3,
    question: '15 - 6 = ?',
    operand1: 15,
    operand2: 6,
    operator: '-',
    answer: 9,
    difficulty: 'medium',
  },
  {
    id: 4,
    question: '4 × 3 = ?',
    operand1: 4,
    operand2: 3,
    operator: '×',
    answer: 12,
    difficulty: 'medium',
  },
  {
    id: 5,
    question: '36 ÷ 4 = ?',
    operand1: 36,
    operand2: 4,
    operator: '÷',
    answer: 9,
    difficulty: 'hard',
  },
];
