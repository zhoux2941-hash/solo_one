import type { AbacusState, BeadColumn, AbacusType, Operator, CalculationStep, BeadChange } from '../types';
import { ABACUS_CONFIG } from './constants';
import { getAdditionFormula, getSubtractionFormula } from './formulas';

export const createInitialBeads = (type: AbacusType, columns: number): BeadColumn[] => {
  const config = ABACUS_CONFIG[type];
  const beadColumns: BeadColumn[] = [];

  for (let i = 0; i < columns; i++) {
    beadColumns.push({
      upper: new Array(config.upperBeads).fill(0),
      lower: new Array(config.lowerBeads).fill(0),
      columnValue: 0,
    });
  }

  return beadColumns;
};

export const createInitialAbacusState = (type: AbacusType = '2-5', columns: number = 8): AbacusState => {
  const beads = createInitialBeads(type, columns);
  return {
    type,
    columns,
    beads,
    currentValue: 0,
    displayValue: '0',
  };
};

export const calculateColumnValue = (column: BeadColumn, type: AbacusType): number => {
  const config = ABACUS_CONFIG[type];
  let value = 0;

  const activeUpperBeads = column.upper.filter(pos => pos === 1).length;
  value += activeUpperBeads * config.upperValue;

  const activeLowerBeads = column.lower.filter(pos => pos === 1).length;
  value += activeLowerBeads * config.lowerValue;

  return value;
};

export const calculateTotalValue = (beads: BeadColumn[], type: AbacusType): number => {
  let total = 0;
  for (let i = 0; i < beads.length; i++) {
    const placeValue = Math.pow(10, beads.length - 1 - i);
    total += calculateColumnValue(beads[i], type) * placeValue;
  }
  return total;
};

export const updateColumnValue = (beads: BeadColumn[], type: AbacusType): BeadColumn[] => {
  return beads.map(column => ({
    ...column,
    columnValue: calculateColumnValue(column, type),
  }));
};

export const setNumberOnAbacus = (
  beads: BeadColumn[],
  type: AbacusType,
  number: number
): BeadColumn[] => {
  const config = ABACUS_CONFIG[type];
  const newBeads = createInitialBeads(type, beads.length);
  const digits = number.toString().padStart(beads.length, '0').split('').map(Number);

  for (let i = 0; i < beads.length; i++) {
    const digit = digits[i];
    const column = newBeads[i];
    const upperCount = Math.floor(digit / 5);
    const lowerCount = digit % 5;

    for (let j = 0; j < config.upperBeads && j < upperCount; j++) {
      column.upper[config.upperBeads - 1 - j] = 1;
    }

    for (let j = 0; j < config.lowerBeads && j < lowerCount; j++) {
      column.lower[j] = 1;
    }
  }

  return updateColumnValue(newBeads, type);
};

export const toggleBead = (
  beads: BeadColumn[],
  type: AbacusType,
  columnIndex: number,
  beadType: 'upper' | 'lower',
  beadIndex: number
): BeadColumn[] => {
  const newBeads = beads.map((col, idx) => {
    if (idx !== columnIndex) return col;
    const newCol = { ...col };

    if (beadType === 'upper') {
      newCol.upper = [...col.upper];
      newCol.upper[beadIndex] = newCol.upper[beadIndex] === 0 ? 1 : 0;
    } else {
      newCol.lower = [...col.lower];
      newCol.lower[beadIndex] = newCol.lower[beadIndex] === 0 ? 1 : 0;
    }

    return newCol;
  });

  return updateColumnValue(newBeads, type);
};

export const clearAbacus = (beads: BeadColumn[], type: AbacusType): BeadColumn[] => {
  return createInitialBeads(type, beads.length);
};

export const generateAdditionSteps = (
  beads: BeadColumn[],
  type: AbacusType,
  operand1: number,
  operand2: number
): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  const result = operand1 + operand2;

  steps.push({
    description: `设置被加数 ${operand1}`,
    formula: '',
    beadChanges: generateSetNumberChanges(beads.length, type, operand1),
  });

  let currentValue = operand1;
  let remaining = operand2;
  let columnFromRight = 0;

  while (remaining > 0) {
    const digit = remaining % 10;
    if (digit > 0) {
      const formula = getAdditionFormula(currentValue, digit);
      const columnIndex = beads.length - 1 - columnFromRight;
      const changes = generateDigitChanges(beads, type, columnIndex, currentValue % 10, digit, '+');

      steps.push({
        description: `在第${beads.length - columnFromRight}位加${digit}`,
        formula: formula.formula,
        beadChanges: changes,
      });

      currentValue = Math.floor(currentValue / 10) * Math.pow(10, columnFromRight) +
        (currentValue % Math.pow(10, columnFromRight)) +
        digit * Math.pow(10, columnFromRight);
    }

    remaining = Math.floor(remaining / 10);
    columnFromRight++;
  }

  steps.push({
    description: `计算完成，结果为 ${result}`,
    formula: '',
    beadChanges: [],
  });

  return steps;
};

export const generateSubtractionSteps = (
  beads: BeadColumn[],
  type: AbacusType,
  operand1: number,
  operand2: number
): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  const result = operand1 - operand2;

  steps.push({
    description: `设置被减数 ${operand1}`,
    formula: '',
    beadChanges: generateSetNumberChanges(beads.length, type, operand1),
  });

  let currentValue = operand1;
  let remaining = operand2;
  let columnFromRight = 0;

  while (remaining > 0) {
    const digit = remaining % 10;
    if (digit > 0) {
      const formula = getSubtractionFormula(currentValue, digit);
      const columnIndex = beads.length - 1 - columnFromRight;
      const changes = generateDigitChanges(beads, type, columnIndex, currentValue % 10, digit, '-');

      steps.push({
        description: `在第${beads.length - columnFromRight}位减${digit}`,
        formula: formula.formula,
        beadChanges: changes,
      });

      currentValue -= digit * Math.pow(10, columnFromRight);
    }

    remaining = Math.floor(remaining / 10);
    columnFromRight++;
  }

  steps.push({
    description: `计算完成，结果为 ${result}`,
    formula: '',
    beadChanges: [],
  });

  return steps;
};

const generateSetNumberChanges = (
  columns: number,
  type: AbacusType,

  number: number

): BeadChange[] => {
  const config = ABACUS_CONFIG[type];
  const changes: BeadChange[] = [];
  const digits = number.toString().padStart(columns, '0').split('').map(Number);

  for (let i = 0; i < columns; i++) {
    const digit = digits[i];
    const upperCount = Math.floor(digit / 5);
    const lowerCount = digit % 5;

    for (let j = 0; j < config.upperBeads; j++) {
      const shouldBeActive = j >= config.upperBeads - upperCount;
      changes.push({
        columnIndex: i,
        beadType: 'upper',
        beadIndex: j,
        fromPosition: 0,
        toPosition: shouldBeActive ? 1 : 0,
      });
    }

    for (let j = 0; j < config.lowerBeads; j++) {
      const shouldBeActive = j < lowerCount;
      changes.push({
        columnIndex: i,
        beadType: 'lower',
        beadIndex: j,
        fromPosition: 0,
        toPosition: j < lowerCount ? 1 : 0,
      });
    }
  }

  return changes;
};

const generateDigitChanges = (
  beads: BeadColumn[],
  type: AbacusType,
  columnIndex: number,
  currentDigit: number,
  digit: number,
  operator: '+' | '-'
): BeadChange[] => {
  const config = ABACUS_CONFIG[type];
  const changes: BeadChange[] = [];
  const column = beads[columnIndex];
  const newDigit = operator === '+' ? currentDigit + digit : currentDigit - digit;

  const safeDigit = Math.max(0, Math.min(9, newDigit));
  const newUpperActive = Math.floor(safeDigit / 5);
  const newLowerActive = safeDigit % 5;

  for (let j = 0; j < config.upperBeads; j++) {
    const shouldBeActive = j >= config.upperBeads - newUpperActive;
    const isActive = column.upper[j] === 1;
    if (shouldBeActive !== isActive) {
      changes.push({
        columnIndex,
        beadType: 'upper',
        beadIndex: j,
        fromPosition: isActive ? 1 : 0,
        toPosition: shouldBeActive ? 1 : 0,
      });
    }
  }

  for (let j = 0; j < config.lowerBeads; j++) {
    const shouldBeActive = j < newLowerActive;
    const isActive = column.lower[j] === 1;
    if (shouldBeActive !== isActive) {
      changes.push({
        columnIndex,
        beadType: 'lower',
        beadIndex: j,
        fromPosition: isActive ? 1 : 0,
        toPosition: shouldBeActive ? 1 : 0,
      });
    }
  }

  return changes;
};

export const generateCalculationSteps = (
  beads: BeadColumn[],
  type: AbacusType,
  operand1: number,
  operand2: number,
  operator: Operator
): CalculationStep[] => {
  switch (operator) {
    case '+':
      return generateAdditionSteps(beads, type, operand1, operand2);
    case '-':
      return generateSubtractionSteps(beads, type, operand1, operand2);
    case '×':
      return generateMultiplicationSteps(beads, type, operand1, operand2);
    case '÷':
      return generateDivisionSteps(beads, type, operand1, operand2);
    default:
      return [];
  }
};

const generateMultiplicationSteps = (
  beads: BeadColumn[],
  type: AbacusType,

  operand1: number,
  operand2: number
): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  const result = operand1 * operand2;

  steps.push({
    description: `乘法: ${operand1} × ${operand2}`,
    formula: '',
    beadChanges: generateSetNumberChanges(beads.length, type, 0),
  });

  const digits2 = operand2.toString().split('').map(Number);
  
  let accumulated = 0;
  for (let i = 0; i < digits2.length; i++) {
    const d = digits2[i];
    if (d > 0) {
      const partial = operand1 * d;
      const shift = digits2.length - 1 - i;
      accumulated += partial * Math.pow(10, shift);

      steps.push({
        description: `${operand1} × ${d} = ${partial}，移位${shift}位`,
        formula: '',
        beadChanges: generateSetNumberChanges(beads.length, type, accumulated),
      });
    }
  }

  steps.push({
    description: `计算完成，结果为 ${result}`,
    formula: '',
    beadChanges: [],
  });

  return steps;
};

const generateDivisionSteps = (
  beads: BeadColumn[],
  type: AbacusType,

  operand1: number,
  operand2: number
): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  const result = Math.floor(operand1 / operand2);

  steps.push({
    description: `除法: ${operand1} ÷ ${operand2}`,
    formula: '',
    beadChanges: generateSetNumberChanges(beads.length, type, operand1),
  });

  let remaining = operand1;
  let quotient = 0;
  let digitIndex = 0;

  while (remaining >= operand2) {
    const count = Math.floor(remaining / operand2);
    remaining -= count * operand2;
    quotient += count;

    steps.push({
      description: `减去 ${count} × ${operand2} = ${count * operand2}`,
      formula: '',
      beadChanges: generateSetNumberChanges(beads.length, type, remaining),
    });
    digitIndex++;
  }

  steps.push({
    description: `计算完成，商为 ${result}`,
    formula: '',
    beadChanges: generateSetNumberChanges(beads.length, type, result),
  });

  return steps;
};
