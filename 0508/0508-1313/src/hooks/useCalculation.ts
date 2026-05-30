import { useState, useCallback, useRef, useEffect } from 'react';
import type { CalculationState, Operator, CalculationStep, BeadChange, BeadColumn, AbacusType } from '../types';
import { generateCalculationSteps, setNumberOnAbacus } from '../utils/abacusMath';
import { ANIMATION_DURATION, STEP_DELAY } from '../utils/constants';

interface UseCalculationProps {
  beads: BeadColumn[];
  type: AbacusType;
  onSetBeads: (beads: BeadColumn[]) => void;
  onSetFormula: (formula: string | null) => void;
}

export const useCalculation = ({ beads, type, onSetBeads, onSetFormula }: UseCalculationProps) => {
  const [calculationState, setCalculationState] = useState<CalculationState>({
    mode: 'manual',
    operand1: null,
    operand2: null,
    operator: null,
    result: null,
    currentStep: -1,
    steps: [],
    currentFormula: null,
    isAnimating: false,
  });

  const animationRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOperand = useCallback((value: number) => {
    setCalculationState(prev => {
      if (prev.operator === null) {
        return { ...prev, operand1: value };
      } else {
        return { ...prev, operand2: value };
      }
    });
  }, []);

  const setOperator = useCallback((op: Operator | null) => {
    setCalculationState(prev => ({ ...prev, operator: op }));
  }, []);

  const setMode = useCallback((mode: 'manual' | 'calculation' | 'practice') => {
    setCalculationState(prev => ({ ...prev, mode }));
  }, []);

  const resetCalculation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCalculationState({
      mode: 'manual',
      operand1: null,
      operand2: null,
      operator: null,
      result: null,
      currentStep: -1,
      steps: [],
      currentFormula: null,
      isAnimating: false,
    });
    onSetFormula(null);
  }, [onSetFormula]);

  const applyBeadChanges = useCallback((changes: BeadChange[], progress: number, currentBeads: BeadColumn[]): BeadColumn[] => {
    const newBeads = currentBeads.map(col => ({
      ...col,
      upper: [...col.upper],
      lower: [...col.lower],
    }));

    for (const change of changes) {
      const { columnIndex, beadType, beadIndex, fromPosition, toPosition } = change;
      const interpolatedValue = fromPosition + (toPosition - fromPosition) * progress;
      const finalValue = progress >= 1 ? toPosition : fromPosition;

      if (beadType === 'upper') {
        newBeads[columnIndex].upper[beadIndex] = progress >= 1 ? finalValue : interpolatedValue;
      } else {
        newBeads[columnIndex].lower[beadIndex] = progress >= 1 ? finalValue : interpolatedValue;
      }
    }

    return newBeads;
  }, []);

  const animateStep = useCallback((step: CalculationStep, onComplete: () => void) => {
    if (step.beadChanges.length === 0) {
      onComplete();
      return;
    }

    const startTime = performance.now();
    let currentBeads = [...beads];

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const newBeads = applyBeadChanges(step.beadChanges, easedProgress, currentBeads);
      onSetBeads(newBeads);
      currentBeads = newBeads;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const finalBeads = applyBeadChanges(step.beadChanges, 1, currentBeads);
        onSetBeads(finalBeads);
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [beads, applyBeadChanges, onSetBeads]);

  const runAllSteps = useCallback(async () => {
    if (calculationState.steps.length === 0) return;

    setCalculationState(prev => ({ ...prev, isAnimating: true }));

    for (let i = 0; i < calculationState.steps.length; i++) {
      const step = calculationState.steps[i];
      
      setCalculationState(prev => ({ 
        ...prev, 
        currentStep: i,
        currentFormula: step.formula || null,
      }));
      onSetFormula(step.formula || null);

      await new Promise<void>((resolve) => {
        animateStep(step, () => {
          timeoutRef.current = setTimeout(resolve, STEP_DELAY / 2);
        });
      });
    }

    setCalculationState(prev => ({ ...prev, isAnimating: false }));
  }, [calculationState.steps, animateStep, onSetFormula]);

  const nextStep = useCallback(() => {
    if (calculationState.currentStep >= calculationState.steps.length - 1) return;
    if (calculationState.isAnimating) return;

    const nextStepIndex = calculationState.currentStep + 1;
    const step = calculationState.steps[nextStepIndex];

    setCalculationState(prev => ({ 
      ...prev, 
      isAnimating: true,
      currentStep: nextStepIndex,
      currentFormula: step.formula || null,
    }));
    onSetFormula(step.formula || null);

    animateStep(step, () => {
      setCalculationState(prev => ({ ...prev, isAnimating: false }));
    });
  }, [calculationState.currentStep, calculationState.steps, calculationState.isAnimating, animateStep, onSetFormula]);

  const prevStep = useCallback(() => {
    if (calculationState.currentStep <= 0) return;
    if (calculationState.isAnimating) return;

    const prevStepIndex = calculationState.currentStep - 1;
    const step = calculationState.steps[prevStepIndex];

    setCalculationState(prev => ({ 
      ...prev, 
      isAnimating: true,
      currentStep: prevStepIndex,
      currentFormula: step.formula || null,
    }));
    onSetFormula(step.formula || null);

    animateStep(step, () => {
      setCalculationState(prev => ({ ...prev, isAnimating: false }));
    });
  }, [calculationState.currentStep, calculationState.steps, calculationState.isAnimating, animateStep, onSetFormula]);

  const startCalculation = useCallback((op1: number, op2: number, operator: Operator) => {
    const steps = generateCalculationSteps(beads, type, op1, op2, operator);
    let result: number;
    switch (operator) {
      case '+': result = op1 + op2; break;
      case '-': result = op1 - op2; break;
      case '×': result = op1 * op2; break;
      case '÷': result = Math.floor(op1 / op2); break;
      default: result = 0;
    }

    setCalculationState(prev => ({
      ...prev,
      operand1: op1,
      operand2: op2,
      operator,
      result,
      steps,
      currentStep: -1,
      mode: 'calculation',
      isAnimating: false,
    }));
  }, [beads, type]);

  const setResultValue = useCallback((value: number) => {
    const newBeads = setNumberOnAbacus(beads, type, value);
    onSetBeads(newBeads);
  }, [beads, type, onSetBeads]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    calculationState,
    setOperand,
    setOperator,
    setMode,
    resetCalculation,
    startCalculation,
    runAllSteps,
    nextStep,
    prevStep,
    setResultValue,
  };
};
