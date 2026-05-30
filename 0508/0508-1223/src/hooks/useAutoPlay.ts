import { useEffect, useRef } from 'react';
import { useHanoiStore } from '../store/useHanoiStore';
import { getSpeedDuration } from '../utils/colorUtils';

export function useAutoPlay() {
  const { isPlaying, speed, stepForward, currentStep, solutionSteps, stopAutoPlay } = useHanoiStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPlaying && currentStep < solutionSteps.length) {
      const duration = getSpeedDuration(speed);
      timeoutRef.current = setTimeout(() => {
        stepForward();
      }, duration);
    } else if (currentStep >= solutionSteps.length) {
      stopAutoPlay();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, speed, currentStep, solutionSteps.length, stepForward, stopAutoPlay]);

  return null;
}
