import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import type { CalculationStep } from '../types';

interface StepDisplayProps {
  steps: CalculationStep[];
  currentStep: number;
  isAnimating: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayAll: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const StepDisplay = ({
  steps,
  currentStep,
  isAnimating,
  onPrev,
  onNext,
  onPlayAll,
  onReset,
  disabled,
}: StepDisplayProps) => {
  if (steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep <= 0;
  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-amber-200 font-semibold flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center bg-amber-800/50 rounded-lg text-sm">
            {Math.max(0, currentStep + 1)}
          </span>
          <span>/ {steps.length} 步骤</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            disabled={disabled || isAnimating}
            className="p-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onPrev}
            disabled={disabled || isAnimating || isFirstStep}
            className="p-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="上一步"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onPlayAll}
            disabled={disabled || isAnimating}
            className="p-2 rounded-lg bg-amber-600/80 hover:bg-amber-500/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={isAnimating ? '演示中...' : '全部演示'}
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={onNext}
            disabled={disabled || isAnimating || isLastStep}
            className="p-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="下一步"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                idx < currentStep
                  ? 'bg-amber-500'
                  : idx === currentStep
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-stone-700'
              }`}
            />
          ))}
        </div>
      </div>

      {currentStepData && (
        <div className="p-4 rounded-xl bg-stone-800/70 border border-stone-700/50">
          <p className="text-amber-100">
            {currentStepData.description}
          </p>
          {currentStepData.formula && (
            <p className="mt-2 text-amber-400 font-semibold text-lg">
              「{currentStepData.formula}」
            </p>
          )}
        </div>
      )}
    </div>
  );
};
